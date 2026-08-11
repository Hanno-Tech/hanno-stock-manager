import Link from 'next/link';
import { Plus, ChevronRight } from 'lucide-react';
import { PageHeader, Mono } from '@/components';
import { buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { listLocationsWithCounts } from '@/features/locations/queries';
import { KIND_ICON, KIND_LABEL, storedLabel } from '@/features/locations/format';
import { listRecentActivity } from '@/features/history/queries';
import { formatDateTime } from '@/features/items/format';
import { requireUser } from '@/features/auth/queries';

const ACTIVITY_LABEL = {
  ENTRADA: 'Recebido',
  ENTREGA: 'Entregue',
  REPOSICIONAMENTO: 'Reposicionado',
} as const;

export default async function LocaisPage() {
  const user = await requireUser();
  const [locations, activity] = await Promise.all([
    listLocationsWithCounts(user.id),
    listRecentActivity(user.id),
  ]);

  const totalStored = locations.reduce((acc, l) => acc + l.stored, 0);

  return (
    <>
      <PageHeader title="Locais" />
      <div className="flex flex-col gap-6 p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-lg font-bold">Visão geral</h2>
          <span className="text-sm text-muted-foreground">
            {totalStored} guardadas em {locations.length}{' '}
            {locations.length === 1 ? 'local' : 'locais'}
          </span>
        </div>

        {locations.length === 0 ? (
          <div className="rounded-xl bg-card p-6 text-center ring-1 ring-foreground/10">
            <p className="font-semibold">Nenhum local cadastrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use o botão + para cadastrar onde você guarda as mercadorias.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {locations.map((l) => {
              const pct = l.capacity ? Math.round((l.stored / l.capacity) * 100) : 0;
              const KindIcon = KIND_ICON[l.kind];
              return (
                <li key={l.id}>
                  <Link
                    href={`/app/locais/${l.id}`}
                    className="block rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:bg-muted/50 active:bg-muted"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <KindIcon className="size-6 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{l.name}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {KIND_LABEL[l.kind]} · {storedLabel(l.stored)}
                        </p>
                      </div>
                      <Mono className="text-sm text-muted-foreground">
                        {l.stored}/{l.capacity}
                      </Mono>
                      <ChevronRight className="size-5 text-muted-foreground" />
                    </div>
                    <Progress value={pct} className="h-2" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {activity.length > 0 && (
          <section>
            <h3 className="text-[0.6875rem] font-bold tracking-wider text-muted-foreground uppercase">
              Atividade recente
            </h3>
            <ul className="mt-2 flex flex-col gap-2">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <div>
                    <Mono className="block text-sm font-semibold">{a.trackingCode}</Mono>
                    <span className="text-sm text-muted-foreground">{ACTIVITY_LABEL[a.type]}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDateTime(a.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <Link
        href="/app/locais/novo"
        aria-label="Adicionar local"
        className={buttonVariants({
          size: 'icon-lg',
          className:
            'fixed right-4 bottom-[calc(5rem+var(--safe-area-bottom))] z-40 rounded-full shadow-lg',
        })}
      >
        <Plus />
      </Link>
    </>
  );
}
