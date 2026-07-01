import 'server-only';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { positions, shelves, sizeCategories } from '@/db/schema';

export type SuggestedPosition = {
  positionId: string;
  label: string;
  shelfCode: string;
  aisle: string | null;
  level: number | null;
};

/**
 * Sugere a primeira posição livre numa estante da categoria compatível
 * com o tamanho (P→Pequeno, M→Médio, G→Grande).
 */
export async function suggestPositionForSize(
  size: 'P' | 'M' | 'G',
): Promise<SuggestedPosition | null> {
  const [row] = await db
    .select({
      positionId: positions.id,
      label: positions.label,
      shelfCode: shelves.code,
      aisle: shelves.aisle,
      level: shelves.level,
    })
    .from(positions)
    .innerJoin(shelves, eq(positions.shelfId, shelves.id))
    .innerJoin(sizeCategories, eq(shelves.categoryId, sizeCategories.id))
    .where(and(eq(sizeCategories.code, size), eq(positions.status, 'LIVRE')))
    .orderBy(asc(shelves.aisle), asc(shelves.level), asc(positions.slotNumber))
    .limit(1);
  return row ?? null;
}
