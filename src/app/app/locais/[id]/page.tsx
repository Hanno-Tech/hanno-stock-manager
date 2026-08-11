import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PageHeader, Mono } from '@/components';
import { Progress } from '@/components/ui/progress';
import { getLocationDetail } from '@/features/locations/queries';
import { KIND_ICON, KIND_LABEL, storedLabel } from '@/features/locations/format';
import { formatDateTime } from '@/features/items/format';
import { requireUser } from '@/features/auth/queries';
import LocationMenu from '@/features/locations/LocationMenu';

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const loc = await getLocationDetail(id, user.id);
  if (!loc) notFound();

  const KindIcon = KIND_ICON[loc.kind];
  const free = loc.capacity - loc.stored;
  const pct = loc.capacity ? Math.round((loc.stored / loc.capacity) * 100) : 0;

  return (
    <>
      <PageHeader
        title={loc.name}
        back
        actions={<LocationMenu locationId={loc.id} locationName={loc.name} />}
      />
      <div className="flex flex-col gap-6 p-4">
        {/* Resumo do local */}
        <section>
          <div className="flex items-center gap-3">
            <KindIcon className="size-8 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">
                {KIND_LABEL[loc.kind]}
                {loc.hint ? ` · ${loc.hint}` : ''}
              </p>
              <p className="font-bold">{storedLabel(loc.stored)}</p>
            </div>
          </div>

          <div className="mt-4 mb-2 flex justify-between text-sm">
            <span>Ocupação</span>
            <span className="font-bold">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2.5" />
          <div className="mt-2 flex gap-6 text-sm text-muted-foreground">
            <span>{loc.stored} guardadas</span>
            <span>{free} vagas livres</span>
          </div>
        </section>

        {/* O ponto do redesign: clicar no local mostra O QUE está dentro dele. */}
        <section>
          <h2 className="font-heading mb-3 text-lg font-bold">Mercadorias aqui</h2>

          {loc.items.length === 0 ? (
            <div className="rounded-xl bg-card p-6 text-center ring-1 ring-foreground/10">
              <p className="text-muted-foreground">Nenhuma mercadoria guardada neste local.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {loc.items.map((it) => (
                <li key={it.itemId}>
                  <Link
                    href={`/app/itens/${it.itemId}`}
                    className="flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:bg-muted/50 active:bg-muted"
                  >
                    <Mono className="shrink-0 rounded-md bg-muted px-2 py-1 text-sm font-bold">
                      {it.positionLabel}
                    </Mono>
                    <div className="min-w-0 flex-1">
                      <Mono className="block truncate font-bold">{it.trackingCode}</Mono>
                      <p className="truncate text-sm text-muted-foreground">
                        {it.customerNote || formatDateTime(it.receivedAt)}
                      </p>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
