import 'server-only';
import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { items, positions, storageLocations } from '@/db/schema';
import type { LocationKind } from '@/db/schema';

export type LocationSummary = {
  id: string;
  name: string;
  kind: LocationKind;
  hint: string | null;
  capacity: number;
  /** Mercadorias aguardando retirada guardadas neste local. */
  stored: number;
};

/**
 * Locais do usuário com quantas mercadorias há em cada um.
 * É a query que alimenta o dashboard — o operador quer ver "Estante 1: 12",
 * não uma distribuição abstrata por tamanho.
 */
export async function listLocationsWithCounts(ownerId: string): Promise<LocationSummary[]> {
  return db
    .select({
      id: storageLocations.id,
      name: storageLocations.name,
      kind: storageLocations.kind,
      hint: storageLocations.hint,
      capacity: storageLocations.capacity,
      stored: sql<number>`count(${items.id})`.mapWith(Number),
    })
    .from(storageLocations)
    .leftJoin(positions, eq(positions.locationId, storageLocations.id))
    .leftJoin(
      items,
      and(eq(items.positionId, positions.id), eq(items.status, 'AGUARDANDO_RETIRADA')),
    )
    .where(eq(storageLocations.ownerId, ownerId))
    .groupBy(storageLocations.id)
    .orderBy(asc(storageLocations.sortOrder), asc(storageLocations.name));
}

export type StoredItemRow = {
  itemId: string;
  trackingCode: string;
  customerNote: string | null;
  receivedAt: Date;
  positionLabel: string;
  slotNumber: number;
};

export type LocationDetail = {
  id: string;
  name: string;
  kind: LocationKind;
  hint: string | null;
  capacity: number;
  stored: number;
  items: StoredItemRow[];
};

/**
 * Detalhe de um local com a LISTA DE MERCADORIAS dentro dele.
 * Retorna null se o local não pertencer ao usuário.
 */
export async function getLocationDetail(
  id: string,
  ownerId: string,
): Promise<LocationDetail | null> {
  const [loc] = await db
    .select({
      id: storageLocations.id,
      name: storageLocations.name,
      kind: storageLocations.kind,
      hint: storageLocations.hint,
      capacity: storageLocations.capacity,
    })
    .from(storageLocations)
    .where(and(eq(storageLocations.id, id), eq(storageLocations.ownerId, ownerId)))
    .limit(1);
  if (!loc) return null;

  const rows = await db
    .select({
      itemId: items.id,
      trackingCode: items.trackingCode,
      customerNote: items.customerNote,
      receivedAt: items.receivedAt,
      positionLabel: positions.label,
      slotNumber: positions.slotNumber,
    })
    .from(positions)
    .innerJoin(
      items,
      and(eq(items.positionId, positions.id), eq(items.status, 'AGUARDANDO_RETIRADA')),
    )
    .where(eq(positions.locationId, id))
    .orderBy(asc(positions.slotNumber));

  return { ...loc, stored: rows.length, items: rows };
}

/** Locais com ao menos uma vaga livre — alimenta o seletor da tela de recebimento. */
export async function listLocationsWithFreeSlots(ownerId: string): Promise<LocationSummary[]> {
  const all = await listLocationsWithCounts(ownerId);
  return all.filter((l) => l.stored < l.capacity);
}

/** Quantos locais o usuário já cadastrou — usado para decidir se mostra o onboarding. */
export async function countLocations(ownerId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(storageLocations)
    .where(eq(storageLocations.ownerId, ownerId));
  return row?.n ?? 0;
}
