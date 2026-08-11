import { PageHeader, InventoryCard } from '@/components';
import { searchItems } from '@/features/items/queries';
import { requireUser } from '@/features/auth/queries';
import { statusPill } from '@/features/items/format';

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const user = await requireUser();
  const results = await searchItems(q, user.id);

  return (
    <>
      <PageHeader title="Busca" back />
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm text-muted-foreground">
          {q ? `Resultados para “${q}”` : 'Itens recentes'} · {results.length}
        </p>

        {results.length === 0 ? (
          <p className="mt-8 text-center text-muted-foreground">Nenhum item encontrado.</p>
        ) : (
          results.map((it) => {
            const pill = statusPill(it.status);
            const local =
              it.locationName && it.positionLabel
                ? `${it.locationName} · vaga ${it.positionLabel}`
                : 'Sem local';
            return (
              <InventoryCard
                key={it.id}
                sku={it.trackingCode}
                title={it.trackingCode}
                subtitle={local}
                status={pill}
                href={`/app/itens/${it.id}`}
              />
            );
          })
        )}
      </div>
    </>
  );
}
