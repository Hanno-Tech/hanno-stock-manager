import { CircleCheck } from 'lucide-react';
import { PageHeader, Mono, StatusPill } from '@/components';
import { getDeliveryStats, listDeliveries, type DeliveryRow } from '@/features/history/queries';
import { requireUser } from '@/features/auth/queries';

function dayBucket(d: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - date.getTime()) / 86_400_000);
  if (diff === 0) return 'HOJE';
  if (diff === 1) return 'ONTEM';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }).toUpperCase();
}

function time(d: Date): string {
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default async function HistoricoPage() {
  const user = await requireUser();
  const [stats, deliveries] = await Promise.all([
    getDeliveryStats(user.id),
    listDeliveries(user.id),
  ]);

  // Agrupa por dia mantendo a ordem (já vem desc por data).
  const groups: { bucket: string; rows: DeliveryRow[] }[] = [];
  for (const row of deliveries) {
    const bucket = dayBucket(row.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.bucket === bucket) last.rows.push(row);
    else groups.push({ bucket, rows: [row] });
  }

  return (
    <>
      <PageHeader title="Histórico" />
      <div className="flex flex-col gap-6 p-4">
        <div className="flex gap-3">
          <div className="flex-1 rounded-lg bg-card p-4">
            <p className="text-sm text-muted-foreground">Entregues hoje</p>
            <Mono className="text-3xl font-bold text-primary">{stats.today}</Mono>
          </div>
          <div className="flex-1 rounded-lg bg-card p-4">
            <p className="text-sm text-muted-foreground">Este mês</p>
            <Mono className="text-3xl font-bold">{stats.month}</Mono>
          </div>
        </div>

        {deliveries.length === 0 && (
          <p className="mt-8 text-center text-muted-foreground">Nenhuma entrega registrada.</p>
        )}

        {groups.map((g) => (
          <section key={g.bucket}>
            <h2 className="text-[0.6875rem] font-bold tracking-wider text-muted-foreground uppercase">
              {g.bucket}
            </h2>
            <ul className="mt-2 flex flex-col gap-2">
              {g.rows.map((r) => (
                <li key={r.id} className="rounded-lg bg-card p-4">
                  <div className="flex items-center justify-between">
                    <Mono className="font-bold">{r.trackingCode}</Mono>
                    <span className="text-sm text-muted-foreground">{time(r.createdAt)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {r.sizeCode && <StatusPill label={r.sizeCode} tone="info" />}
                    <span
                      className={`text-sm text-muted-foreground ${r.deliveredTo ? '' : 'italic'}`}
                    >
                      {r.deliveredTo ? `Entregue a: ${r.deliveredTo}` : 'Sem registro'}
                    </span>
                    <CircleCheck className="ml-auto size-4 shrink-0 text-ml-success" />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
