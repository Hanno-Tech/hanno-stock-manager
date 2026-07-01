'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { items, positions, movements, shelves, sizeCategories } from '@/db/schema';
import { getSession } from '@/lib/auth/session';
import { suggestPositionForSize, type SuggestedPosition } from './receive';

/** Server action fina para o cliente re-consultar a sugestão ao trocar o tamanho. */
export async function suggestPosition(size: 'P' | 'M' | 'G'): Promise<SuggestedPosition | null> {
  return suggestPositionForSize(size);
}

const receiveSchema = z.object({
  trackingCode: z.string().min(1, 'Informe o código'),
  size: z.enum(['P', 'M', 'G']),
  note: z.string().optional(),
});

export type ReceiveState = { error?: string };

/**
 * Registra a entrada de uma mercadoria: escolhe (trava) a primeira posição
 * livre da categoria, cria o item, ocupa a posição e grava movement ENTRADA.
 */
export async function receiveItem(_: ReceiveState, formData: FormData): Promise<ReceiveState> {
  const parsed = receiveSchema.safeParse({
    trackingCode: formData.get('trackingCode'),
    size: formData.get('size'),
    note: formData.get('note') || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { trackingCode, size, note } = parsed.data;
  const session = await getSession();

  const dup = await db
    .select({ id: items.id })
    .from(items)
    .where(eq(items.trackingCode, trackingCode.trim()))
    .limit(1);
  if (dup.length) return { error: 'Já existe um item com esse código' };

  try {
    await db.transaction(async (tx) => {
      // Trava a primeira posição livre da categoria para evitar corrida entre operadores.
      const [pos] = await tx
        .select({ id: positions.id })
        .from(positions)
        .innerJoin(shelves, eq(positions.shelfId, shelves.id))
        .innerJoin(sizeCategories, eq(shelves.categoryId, sizeCategories.id))
        .where(and(eq(sizeCategories.code, size), eq(positions.status, 'LIVRE')))
        .orderBy(asc(shelves.aisle), asc(shelves.level), asc(positions.slotNumber))
        .limit(1)
        .for('update', { of: positions });

      if (!pos) throw new Error('SEM_POSICAO');

      const [item] = await tx
        .insert(items)
        .values({
          trackingCode: trackingCode.trim(),
          sizeCode: size,
          status: 'AGUARDANDO_RETIRADA',
          positionId: pos.id,
          customerNote: note?.trim() || null,
        })
        .returning();

      await tx.update(positions).set({ status: 'OCUPADA' }).where(eq(positions.id, pos.id));
      await tx.insert(movements).values({
        itemId: item.id,
        type: 'ENTRADA',
        toPositionId: pos.id,
        actorId: session?.userId ?? null,
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'SEM_POSICAO') {
      return { error: `Não há posições livres para o tamanho ${size}` };
    }
    return { error: 'Falha ao salvar a entrada' };
  }

  revalidatePath('/app');
  revalidatePath('/app/estantes');
  redirect('/app');
}

/** Confirma a entrega/retirada de um item: libera a posição e registra o movimento. */
export async function confirmDelivery(itemId: string, deliveredTo?: string): Promise<void> {
  const session = await getSession();

  await db.transaction(async (tx) => {
    const [item] = await tx.select().from(items).where(eq(items.id, itemId)).limit(1).for('update');
    if (!item) throw new Error('Item não encontrado');
    if (item.status === 'ENTREGUE') return;

    const fromPositionId = item.positionId;

    await tx
      .update(items)
      .set({
        status: 'ENTREGUE',
        deliveredAt: new Date(),
        deliveredTo: deliveredTo?.trim() || null,
        positionId: null,
      })
      .where(eq(items.id, itemId));

    if (fromPositionId) {
      await tx.update(positions).set({ status: 'LIVRE' }).where(eq(positions.id, fromPositionId));
    }

    await tx.insert(movements).values({
      itemId,
      type: 'ENTREGA',
      fromPositionId,
      actorId: session?.userId ?? null,
      note: deliveredTo?.trim() || null,
    });
  });

  revalidatePath('/app');
  revalidatePath(`/app/itens/${itemId}`);
  revalidatePath('/app/historico');
}
