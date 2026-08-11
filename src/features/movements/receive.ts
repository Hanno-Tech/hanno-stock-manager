import 'server-only';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { positions, storageLocations } from '@/db/schema';

export type SuggestedPosition = {
  positionId: string;
  label: string;
  locationId: string;
  locationName: string;
  hint: string | null;
};

/**
 * Sugere a primeira vaga livre.
 *
 * Com locais nomeados livremente não existe mais um critério automático de
 * "que local combina com este item" — quem sabe isso é o operador. Então:
 * se ele escolheu um local, sugerimos a primeira vaga livre lá dentro;
 * se não escolheu, caímos no primeiro local (por ordem) que ainda tem espaço.
 */
export async function suggestFreePosition(
  ownerId: string,
  locationId?: string,
): Promise<SuggestedPosition | null> {
  const [row] = await db
    .select({
      positionId: positions.id,
      label: positions.label,
      locationId: storageLocations.id,
      locationName: storageLocations.name,
      hint: storageLocations.hint,
    })
    .from(positions)
    .innerJoin(storageLocations, eq(positions.locationId, storageLocations.id))
    .where(
      and(
        eq(positions.status, 'LIVRE'),
        eq(storageLocations.ownerId, ownerId),
        ...(locationId ? [eq(storageLocations.id, locationId)] : []),
      ),
    )
    .orderBy(asc(storageLocations.sortOrder), asc(storageLocations.name), asc(positions.slotNumber))
    .limit(1);
  return row ?? null;
}
