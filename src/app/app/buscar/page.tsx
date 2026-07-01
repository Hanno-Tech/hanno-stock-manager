import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { PageHeader, InventoryCard } from '@/components';
import { searchItems } from '@/features/items/queries';
import { SIZE_LABEL, statusPill } from '@/features/items/format';

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const results = await searchItems(q);

  return (
    <>
      <PageHeader title="Busca" back />
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          {q ? `Resultados para “${q}”` : 'Itens recentes'} · {results.length}
        </Typography>
        {results.length === 0 && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
            Nenhum item encontrado.
          </Typography>
        )}
        {results.map((it) => {
          const pill = statusPill(it.status);
          const local =
            it.shelfCode && it.positionLabel
              ? `${SIZE_LABEL[it.sizeCode]} · ${it.shelfCode}/${it.positionLabel}`
              : SIZE_LABEL[it.sizeCode];
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
        })}
      </Box>
    </>
  );
}
