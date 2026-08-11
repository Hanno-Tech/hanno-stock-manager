import Link from "next/link";
import {
  Package,
  CircleCheck,
  ScanLine,
  ChevronRight,
  Plus,
} from "lucide-react";
import { PageHeader, Mono } from "@/components";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import DashboardSearch from "@/features/dashboard/DashboardSearch";
import { getDashboardStats } from "@/features/dashboard/queries";
import { listLocationsWithCounts } from "@/features/locations/queries";
import { KIND_ICON, storedLabel } from "@/features/locations/format";
import { requireUser } from "@/features/auth/queries";

function KpiCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="flex-1 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <Mono className={`text-3xl font-bold ${accent}`}>{value}</Mono>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, locations] = await Promise.all([
    getDashboardStats(user.id),
    listLocationsWithCounts(user.id),
  ]);

  return (
    <>
      <PageHeader title="Estoque Rápido" />
      <div className="flex flex-col gap-6 p-4">
        <DashboardSearch />

        <div className="flex gap-3">
          <KpiCard
            icon={<Package className="size-4" />}
            label="Em estoque"
            value={stats.totalInStock}
            accent="text-primary"
          />
          <KpiCard
            icon={<CircleCheck className="size-4" />}
            label="Recebidos hoje"
            value={stats.receivedToday}
            accent="text-ml-success"
          />
        </div>

        {/* Onde as mercadorias estão guardadas — cada card abre a lista do local. */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-heading text-lg font-bold">Seus locais</h2>
            <span className="text-sm text-muted-foreground">
              {locations.length} {locations.length === 1 ? "local" : "locais"}
            </span>
          </div>

          {locations.length === 0 ? (
            <div className="rounded-xl bg-card p-6 text-center ring-1 ring-foreground/10">
              <p className="font-semibold">Nenhum local cadastrado</p>
              <p className="mt-1 mb-4 text-sm text-muted-foreground">
                Cadastre onde você guarda as mercadorias — Estante 1, Caixa 2,
                etc.
              </p>
              <Link href="/app/locais/novo" className={buttonVariants()}>
                <Plus />
                Cadastrar local
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {locations.map((l) => {
                const pct = l.capacity
                  ? Math.round((l.stored / l.capacity) * 100)
                  : 0;
                const KindIcon = KIND_ICON[l.kind];
                return (
                  <li key={l.id}>
                    <Link
                      href={`/app/locais/${l.id}`}
                      className="block rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:bg-muted/50 active:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <KindIcon className="size-6 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold">{l.name}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {storedLabel(l.stored)}
                            {l.hint ? ` · ${l.hint}` : ""}
                          </p>
                        </div>
                        <Mono className="text-2xl font-bold text-primary">
                          {l.stored}
                        </Mono>
                        <ChevronRight className="size-5 text-muted-foreground" />
                      </div>
                      <Progress value={pct} className="mt-3 h-2" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <Link
          href="/app/receber"
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          <ScanLine />
          Receber Mercadoria
        </Link>
      </div>
    </>
  );
}
