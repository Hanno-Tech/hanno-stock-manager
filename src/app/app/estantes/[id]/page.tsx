import { notFound } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import { PageHeader, Mono } from '@/components';
import { getShelfDetail } from '@/features/shelves/queries';
import { requireUser } from '@/features/auth/queries';
import ShelfMenu from '@/features/shelves/ShelfMenu';

export default async function ShelfDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const shelf = await getShelfDetail(id, user.id);
  if (!shelf) notFound();

  const occupied = shelf.positions.filter((p) => p.status === 'OCUPADA').length;
  const free = shelf.capacity - occupied;
  const pct = shelf.capacity ? Math.round((occupied / shelf.capacity) * 100) : 0;

  return (
    <>
      <PageHeader
        title={shelf.code}
        back
        actions={<ShelfMenu shelfId={shelf.id} shelfCode={shelf.code} />}
      />
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {shelf.categoryName} · Capacidade {shelf.capacity} posições
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, mb: 1 }}>
            <Typography variant="body2">Ocupação</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {pct}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={pct} sx={{ height: 10, borderRadius: 5 }} />
          <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {occupied} ocupadas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {free} livres
            </Typography>
          </Box>
        </Box>

        <Box>
          <Typography variant="h2" sx={{ mb: 1.5 }}>
            Posições (1–{shelf.capacity})
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
            {shelf.positions.map((p) => {
              const occupiedPos = p.status === 'OCUPADA' && p.itemId;
              const card = (
                <Box sx={{ p: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Mono variant="body1" sx={{ fontWeight: 700 }}>
                      {p.label}
                    </Mono>
                    <Typography
                      variant="overline"
                      sx={{ color: occupiedPos ? 'primary.main' : 'text.secondary' }}
                    >
                      {occupiedPos ? 'Ocupada' : 'Livre'}
                    </Typography>
                  </Box>
                  {occupiedPos && (
                    <Mono variant="body2" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {p.trackingCode}
                    </Mono>
                  )}
                </Box>
              );
              return (
                <Card key={p.id} sx={{ bgcolor: occupiedPos ? 'background.paper' : '#eff4ff' }}>
                  {occupiedPos ? (
                    <CardActionArea href={`/app/itens/${p.itemId}`}>
                      {card}
                    </CardActionArea>
                  ) : (
                    card
                  )}
                </Card>
              );
            })}
          </Box>
        </Box>
      </Box>
    </>
  );
}
