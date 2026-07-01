import 'server-only';
import { desc, eq, ilike } from 'drizzle-orm';
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

/** Busca itens por código de rastreio (parcial). */
export async function searchItems(q: string): Promise<ItemListRow[]> {
  const term = q.trim();
  const query = db
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
    .orderBy(desc(items.receivedAt))
    .limit(30);

  if (term) query.where(ilike(items.trackingCode, `%${term}%`));
  return query;
}

export type ItemDetail = NonNullable<Awaited<ReturnType<typeof getItemById>>>;

/** Detalhe completo de um item, com posição/estante. */
export async function getItemById(id: string) {
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
    .where(eq(items.id, id))
    .limit(1);
  return row ?? null;
}
