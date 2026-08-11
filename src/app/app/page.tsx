import Link from 'next/link';
import { ScanLine, ChevronRight, Plus } from 'lucide-react';
import { PageHeader, Mono } from '@/components';
import { buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import DashboardSearch from '@/features/dashboard/DashboardSearch';
import { getDashboardStats } from '@/features/dashboard/queries';
import { listLocationsWithCounts } from '@/features/locations/queries';
import { KIND_ICON, storedLabel } from '@/features/locations/format';
import { requireUser } from '@/features/auth/queries';

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, locations] = await Promise.all([
    getDashboardStats(user.id),
    listLocationsWithCounts(user.id),
  ]);

  return (
    <>
      <PageHeader title="Estoque Rápido" />

      {/* Faixa amarela contínua com o header: os números do dia em tipografia
          pesada sobre a cor da marca, como as telas de resumo do Tetris. */}
      <div className="bg-ml-yellow px-4 pb-5 text-ml-yellow-on">
        <div className="flex gap-8">
          <div>
            <Mono className="block text-4xl leading-none font-bold">{stats.totalInStock}</Mono>
            <p className="mt-1 text-sm font-semibold">Em estoque</p>
          </div>
          <div>
            <Mono className="block text-4xl leading-none font-bold">{stats.receivedToday}</Mono>
            <p className="mt-1 text-sm font-semibold">Recebidos hoje</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-4">
        <DashboardSearch />

        {/* Ação principal do operador — grande e no alcance do polegar. */}
        <Link href="/app/receber" className={buttonVariants({ size: 'lg', className: 'w-full' })}>
          <ScanLine />
          Receber Mercadoria
        </Link>

        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-heading text-base font-bold">Seus locais</h2>
            <span className="text-sm text-muted-foreground">
              {locations.length} {locations.length === 1 ? 'local' : 'locais'}
            </span>
          </div>

          {locations.length === 0 ? (
            <div className="rounded-lg bg-card p-6 text-center">
              <p className="font-bold">Nenhum local cadastrado</p>
              <p className="mt-1 mb-4 text-sm text-muted-foreground">
                Cadastre onde você guarda as mercadorias — Estante 1, Caixa 2, etc.
              </p>
              <Link href="/app/locais/novo" className={buttonVariants()}>
                <Plus />
                Cadastrar local
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {locations.map((l) => {
                const pct = l.capacity ? Math.round((l.stored / l.capacity) * 100) : 0;
                const KindIcon = KIND_ICON[l.kind];
                return (
                  <li key={l.id}>
                    <Link
                      href={`/app/locais/${l.id}`}
                      className="block rounded-lg bg-card p-4 transition-colors hover:bg-muted/60 active:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <KindIcon className="size-6 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-lg font-bold">{l.name}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {storedLabel(l.stored)}
                            {l.hint ? ` · ${l.hint}` : ''}
                          </p>
                        </div>
                        <Mono className="text-3xl font-bold">{l.stored}</Mono>
                        <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                      </div>
                      <Progress value={pct} className="mt-3 h-1.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
