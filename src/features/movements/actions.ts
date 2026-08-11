'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { items, positions, movements, storageLocations } from '@/db/schema';
import { getSession } from '@/lib/auth/session';
import { suggestFreePosition, type SuggestedPosition } from './receive';

/** Server action fina para o cliente re-consultar a sugestão ao trocar de local. */
export async function suggestPosition(locationId?: string): Promise<SuggestedPosition | null> {
  const session = await getSession();
  if (!session) return null;
  return suggestFreePosition(session.userId, locationId);
}

const receiveSchema = z.object({
  trackingCode: z.string().min(1, 'Informe o código'),
  locationId: z.uuid('Escolha um local').optional(),
  size: z.enum(['P', 'M', 'G']).optional(),
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
    locationId: formData.get('locationId') || undefined,
    size: formData.get('size') || undefined,
    note: formData.get('note') || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { trackingCode, locationId, size, note } = parsed.data;
  const session = await getSession();
  if (!session) redirect('/login');
  const ownerId = session.userId;

  const dup = await db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.ownerId, ownerId), eq(items.trackingCode, trackingCode.trim())))
    .limit(1);
  if (dup.length) return { error: 'Já existe um item com esse código' };

  try {
    await db.transaction(async (tx) => {
      // Trava a primeira vaga livre do local escolhido (ou do primeiro com espaço).
      const [pos] = await tx
        .select({ id: positions.id })
        .from(positions)
        .innerJoin(storageLocations, eq(positions.locationId, storageLocations.id))
        .where(
          and(
            eq(positions.status, 'LIVRE'),
            eq(storageLocations.ownerId, ownerId),
            ...(locationId ? [eq(storageLocations.id, locationId)] : []),
          ),
        )
        .orderBy(
          asc(storageLocations.sortOrder),
          asc(storageLocations.name),
          asc(positions.slotNumber),
        )
        .limit(1)
        .for('update', { of: positions });

      if (!pos) throw new Error('SEM_POSICAO');

      const [item] = await tx
        .insert(items)
        .values({
          ownerId,
          trackingCode: trackingCode.trim(),
          sizeCode: size ?? null,
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
      return {
        error: locationId
          ? 'Este local está cheio. Escolha outro.'
          : 'Não há vagas livres. Cadastre um novo local.',
      };
    }
    return { error: 'Falha ao salvar a entrada' };
  }

  revalidatePath('/app');
  revalidatePath('/app/locais');
  redirect('/app');
}

/** Confirma a entrega/retirada de um item: libera a posição e registra o movimento. */
export async function confirmDelivery(itemId: string, deliveredTo?: string): Promise<void> {
  const session = await getSession();
  if (!session) redirect('/login');
  const ownerId = session.userId;

  await db.transaction(async (tx) => {
    // Só entrega itens do próprio usuário.
    const [item] = await tx
      .select()
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.ownerId, ownerId)))
      .limit(1)
      .for('update');
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
