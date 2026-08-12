import 'server-only';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/db';
import { items, positions, storageLocations } from '@/db/schema';

export type ItemListRow = {
  id: string;
  trackingCode: string;
  customerName: string | null;
  sizeCode: 'P' | 'M' | 'G' | null;
  status: 'AGUARDANDO_RETIRADA' | 'ENTREGUE';
  locationName: string | null;
  positionLabel: string | null;
};

/**
 * Busca por nome de quem retira, telefone, código de rastreio, observação ou
 * código de retirada já usado. O nome vem primeiro de propósito: é a chave que
 * o operador tem na mão quando o cliente chega no balcão.
 */
export async function searchItems(q: string, ownerId: string): Promise<ItemListRow[]> {
  const term = q.trim();
  const where = term
    ? and(
        eq(items.ownerId, ownerId),
        or(
          ilike(items.customerName, `%${term}%`),
          ilike(items.customerPhone, `%${term}%`),
          ilike(items.trackingCode, `%${term}%`),
          ilike(items.customerNote, `%${term}%`),
          ilike(items.pickupPhrase, `%${term}%`),
        ),
      )
    : eq(items.ownerId, ownerId);

  return db
    .select({
      id: items.id,
      trackingCode: items.trackingCode,
      customerName: items.customerName,
      sizeCode: items.sizeCode,
      status: items.status,
      locationName: storageLocations.name,
      positionLabel: positions.label,
    })
    .from(items)
    .leftJoin(positions, eq(items.positionId, positions.id))
    .leftJoin(storageLocations, eq(positions.locationId, storageLocations.id))
    .where(where)
    .orderBy(desc(items.receivedAt))
    .limit(30);
}

export type ItemDetail = NonNullable<Awaited<ReturnType<typeof getItemById>>>;

/** Detalhe completo de um item do usuário, com a vaga e o local onde está guardado. */
export async function getItemById(id: string, ownerId: string) {
  const [row] = await db
    .select({
      id: items.id,
      trackingCode: items.trackingCode,
      sizeCode: items.sizeCode,
      status: items.status,
      customerName: items.customerName,
      customerPhone: items.customerPhone,
      customerNote: items.customerNote,
      photoUrl: items.photoUrl,
      receivedAt: items.receivedAt,
      deliveredAt: items.deliveredAt,
      deliveredTo: items.deliveredTo,
      positionId: items.positionId,
      positionLabel: positions.label,
      locationId: storageLocations.id,
      locationName: storageLocations.name,
      locationKind: storageLocations.kind,
      locationHint: storageLocations.hint,
    })
    .from(items)
    .leftJoin(positions, eq(items.positionId, positions.id))
    .leftJoin(storageLocations, eq(positions.locationId, storageLocations.id))
    .where(and(eq(items.id, id), eq(items.ownerId, ownerId)))
    .limit(1);
  return row ?? null;
}
