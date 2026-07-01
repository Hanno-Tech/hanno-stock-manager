import 'server-only';
import { and, desc, eq, ilike } from 'drizzle-orm';
import { db } from '@/db';
import { items, positions, shelves } from '@/db/schema';

export type ItemListRow = {
  id: string;
  trackingCode: string;
  sizeCode: 'P' | 'M' | 'G';
  status: 'AGUARDANDO_RETIRADA' | 'ENTREGUE';
  shelfCode: string | null;
  positionLabel: string | null;
};

/** Busca itens do usuário por código de rastreio (parcial). */
export async function searchItems(q: string, ownerId: string): Promise<ItemListRow[]> {
  const term = q.trim();
  const where = term
    ? and(eq(items.ownerId, ownerId), ilike(items.trackingCode, `%${term}%`))
    : eq(items.ownerId, ownerId);

  return db
    .select({
      id: items.id,
      trackingCode: items.trackingCode,
      sizeCode: items.sizeCode,
      status: items.status,
      shelfCode: shelves.code,
      positionLabel: positions.label,
    })
    .from(items)
    .leftJoin(positions, eq(items.positionId, positions.id))
    .leftJoin(shelves, eq(positions.shelfId, shelves.id))
    .where(where)
    .orderBy(desc(items.receivedAt))
    .limit(30);
}

export type ItemDetail = NonNullable<Awaited<ReturnType<typeof getItemById>>>;

/** Detalhe completo de um item do usuário, com posição/estante. */
export async function getItemById(id: string, ownerId: string) {
  const [row] = await db
    .select({
      id: items.id,
      trackingCode: items.trackingCode,
      sizeCode: items.sizeCode,
      status: items.status,
      customerNote: items.customerNote,
      photoUrl: items.photoUrl,
      receivedAt: items.receivedAt,
      deliveredAt: items.deliveredAt,
      deliveredTo: items.deliveredTo,
      positionId: items.positionId,
      positionLabel: positions.label,
      shelfCode: shelves.code,
      shelfAisle: shelves.aisle,
      shelfLevel: shelves.level,
    })
    .from(items)
    .leftJoin(positions, eq(items.positionId, positions.id))
    .leftJoin(shelves, eq(positions.shelfId, shelves.id))
    .where(and(eq(items.id, id), eq(items.ownerId, ownerId)))
    .limit(1);
  return row ?? null;
}
