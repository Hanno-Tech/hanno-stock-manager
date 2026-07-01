import 'server-only';
import { and, count, desc, eq, gte } from 'drizzle-orm';
import { db } from '@/db';
import { movements, items } from '@/db/schema';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getDeliveryStats(ownerId: string): Promise<{ today: number; month: number }> {
  const [today, month] = await Promise.all([
    db
      .select({ n: count() })
      .from(movements)
      .innerJoin(items, eq(movements.itemId, items.id))
      .where(
        and(
          eq(movements.type, 'ENTREGA'),
          gte(movements.createdAt, startOfToday()),
          eq(items.ownerId, ownerId),
        ),
      ),
    db
      .select({ n: count() })
      .from(movements)
      .innerJoin(items, eq(movements.itemId, items.id))
      .where(
        and(
          eq(movements.type, 'ENTREGA'),
          gte(movements.createdAt, startOfMonth()),
          eq(items.ownerId, ownerId),
        ),
      ),
  ]);
  return { today: today[0]?.n ?? 0, month: month[0]?.n ?? 0 };
}

export type DeliveryRow = {
  id: string;
  trackingCode: string;
  sizeCode: 'P' | 'M' | 'G';
  deliveredTo: string | null;
  createdAt: Date;
};

export async function listDeliveries(ownerId: string, limit = 50): Promise<DeliveryRow[]> {
  return db
    .select({
      id: movements.id,
      trackingCode: items.trackingCode,
      sizeCode: items.sizeCode,
      deliveredTo: movements.note,
      createdAt: movements.createdAt,
    })
    .from(movements)
    .innerJoin(items, eq(movements.itemId, items.id))
    .where(and(eq(movements.type, 'ENTREGA'), eq(items.ownerId, ownerId)))
    .orderBy(desc(movements.createdAt))
    .limit(limit);
}
