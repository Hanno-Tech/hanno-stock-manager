import 'server-only';
import { and, count, eq, gte } from 'drizzle-orm';
import { db } from '@/db';
import { items, movements, shelves } from '@/db/schema';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export type DashboardStats = {
  totalInStock: number;
  receivedToday: number;
  bySize: { P: number; M: number; G: number };
};

/** KPIs do dashboard, sempre escopados ao usuário dono. */
export async function getDashboardStats(ownerId: string): Promise<DashboardStats> {
  const inStock = and(eq(items.status, 'AGUARDANDO_RETIRADA'), eq(items.ownerId, ownerId));

  const [[total], received, sizes] = await Promise.all([
    db.select({ n: count() }).from(items).where(inStock),
    db
      .select({ n: count() })
      .from(movements)
      .innerJoin(items, eq(movements.itemId, items.id))
      .where(
        and(
          eq(movements.type, 'ENTRADA'),
          gte(movements.createdAt, startOfToday()),
          eq(items.ownerId, ownerId),
        ),
      ),
    db.select({ size: items.sizeCode, n: count() }).from(items).where(inStock).groupBy(items.sizeCode),
  ]);

  const bySize = { P: 0, M: 0, G: 0 };
  for (const row of sizes) bySize[row.size] = row.n;

  return {
    totalInStock: total?.n ?? 0,
    receivedToday: received[0]?.n ?? 0,
    bySize,
  };
}

/** Total de estantes do usuário. */
export async function getShelfCount(ownerId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(shelves)
    .where(eq(shelves.ownerId, ownerId));
  return row?.n ?? 0;
}
