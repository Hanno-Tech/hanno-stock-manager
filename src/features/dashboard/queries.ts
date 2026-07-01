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

/** KPIs do dashboard, derivados de items + movements. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const inStock = and(eq(items.status, 'AGUARDANDO_RETIRADA'));

  const [[total], received, sizes] = await Promise.all([
    db.select({ n: count() }).from(items).where(inStock),
    db
      .select({ n: count() })
      .from(movements)
      .where(and(eq(movements.type, 'ENTRADA'), gte(movements.createdAt, startOfToday()))),
    db
      .select({ size: items.sizeCode, n: count() })
      .from(items)
      .where(inStock)
      .groupBy(items.sizeCode),
  ]);

  const bySize = { P: 0, M: 0, G: 0 };
  for (const row of sizes) bySize[row.size] = row.n;

  return {
    totalInStock: total?.n ?? 0,
    receivedToday: received[0]?.n ?? 0,
    bySize,
  };
}

/** Total de estantes cadastradas (usado no cabeçalho de Gerenciar Estantes). */
export async function getShelfCount(): Promise<number> {
  const [row] = await db.select({ n: count() }).from(shelves);
  return row?.n ?? 0;
}
