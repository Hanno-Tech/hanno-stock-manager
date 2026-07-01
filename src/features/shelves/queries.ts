import 'server-only';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { movements, items, positions, shelves, sizeCategories } from '@/db/schema';

export type ShelfSummary = {
  id: string;
  code: string;
  categoryCode: 'P' | 'M' | 'G';
  categoryName: string;
  capacity: number;
  occupied: number;
};

/** Lista estantes do usuário com ocupação (posições OCUPADAS / capacidade). */
export async function listShelvesWithOccupancy(ownerId: string): Promise<ShelfSummary[]> {
  const rows = await db
    .select({
      id: shelves.id,
      code: shelves.code,
      categoryCode: sizeCategories.code,
      categoryName: sizeCategories.name,
      capacity: shelves.capacity,
      occupied: sql<number>`count(*) filter (where ${positions.status} = 'OCUPADA')`.mapWith(Number),
    })
    .from(shelves)
    .innerJoin(sizeCategories, eq(shelves.categoryId, sizeCategories.id))
    .leftJoin(positions, eq(positions.shelfId, shelves.id))
    .where(eq(shelves.ownerId, ownerId))
    .groupBy(shelves.id, sizeCategories.code, sizeCategories.name, sizeCategories.sortOrder)
    .orderBy(sizeCategories.sortOrder, shelves.code);
  return rows;
}

export type CategoryInfo = {
  code: 'P' | 'M' | 'G';
  name: string;
  description: string | null;
  shelfCount: number;
};

/** Categorias (globais) com a contagem de estantes DO USUÁRIO. */
export async function listCategories(ownerId: string): Promise<CategoryInfo[]> {
  return db
    .select({
      code: sizeCategories.code,
      name: sizeCategories.name,
      description: sizeCategories.description,
      shelfCount: count(shelves.id),
    })
    .from(sizeCategories)
    .leftJoin(shelves, and(eq(shelves.categoryId, sizeCategories.id), eq(shelves.ownerId, ownerId)))
    .groupBy(sizeCategories.id)
    .orderBy(sizeCategories.sortOrder);
}

export type RecentActivity = {
  id: string;
  type: 'ENTRADA' | 'ENTREGA' | 'REPOSICIONAMENTO';
  trackingCode: string;
  sizeCode: 'P' | 'M' | 'G';
  createdAt: Date;
};

export async function listRecentActivity(ownerId: string, limit = 8): Promise<RecentActivity[]> {
  return db
    .select({
      id: movements.id,
      type: movements.type,
      trackingCode: items.trackingCode,
      sizeCode: items.sizeCode,
      createdAt: movements.createdAt,
    })
    .from(movements)
    .innerJoin(items, eq(movements.itemId, items.id))
    .where(eq(items.ownerId, ownerId))
    .orderBy(desc(movements.createdAt))
    .limit(limit);
}

export type ShelfDetail = {
  id: string;
  code: string;
  categoryName: string;
  capacity: number;
  positions: {
    id: string;
    label: string;
    slotNumber: number;
    status: 'LIVRE' | 'OCUPADA';
    itemId: string | null;
    trackingCode: string | null;
  }[];
};

/** Detalhe de uma estante — retorna null se não pertencer ao usuário. */
export async function getShelfDetail(id: string, ownerId: string): Promise<ShelfDetail | null> {
  const [shelf] = await db
    .select({
      id: shelves.id,
      code: shelves.code,
      categoryName: sizeCategories.name,
      capacity: shelves.capacity,
    })
    .from(shelves)
    .innerJoin(sizeCategories, eq(shelves.categoryId, sizeCategories.id))
    .where(and(eq(shelves.id, id), eq(shelves.ownerId, ownerId)))
    .limit(1);
  if (!shelf) return null;

  const pos = await db
    .select({
      id: positions.id,
      label: positions.label,
      slotNumber: positions.slotNumber,
      status: positions.status,
      itemId: items.id,
      trackingCode: items.trackingCode,
    })
    .from(positions)
    .leftJoin(items, and(eq(items.positionId, positions.id), eq(items.status, 'AGUARDANDO_RETIRADA')))
    .where(eq(positions.shelfId, id))
    .orderBy(positions.slotNumber);

  return { ...shelf, positions: pos };
}
