'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { items } from '@/db/schema';
import { uploadObject, deleteObject } from '@/lib/storage/blob';
import { getSession } from '@/lib/auth/session';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export type PhotoState = { error?: string; ok?: boolean };

/** Envia a foto opcional de um item para o storage e salva a URL. */
export async function uploadItemPhoto(
  itemId: string,
  _: PhotoState,
  formData: FormData,
): Promise<PhotoState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const file = formData.get('photo');
  if (!(file instanceof File) || file.size === 0) return { error: 'Selecione uma imagem' };
  if (!ALLOWED.includes(file.type)) return { error: 'Formato inválido (use JPEG, PNG ou WebP)' };
  if (file.size > MAX_BYTES) return { error: 'Imagem muito grande (máx. 5 MB)' };

  // Garante que o item é do usuário antes de subir a foto.
  const [owned] = await db
    .select({ id: items.id, photoUrl: items.photoUrl })
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.ownerId, session.userId)))
    .limit(1);
  if (!owned) return { error: 'Item não encontrado' };

  const ext = file.type.split('/')[1];
  const key = `items/${itemId}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  let url: string;
  try {
    url = await uploadObject(key, buffer, file.type);
  } catch (err) {
    // Storage indisponível ou mal configurado: vira mensagem na tela, não erro 500.
    console.error('falha ao subir foto do item', itemId, err);
    return { error: 'Não foi possível enviar a foto. Tente de novo.' };
  }

  await db
    .update(items)
    .set({ photoUrl: url })
    .where(and(eq(items.id, itemId), eq(items.ownerId, session.userId)));

  // Trocar a foto descarta a anterior — a cota do Blob é pequena. Falha aqui não
  // invalida o upload que já deu certo, só deixa um objeto órfão.
  if (owned.photoUrl && owned.photoUrl !== url) {
    try {
      await deleteObject(owned.photoUrl);
    } catch (err) {
      console.error('falha ao remover foto antiga do item', itemId, err);
    }
  }

  revalidatePath(`/app/itens/${itemId}`);
  return { ok: true };
}
