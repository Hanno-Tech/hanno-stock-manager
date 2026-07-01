import { notFound } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import { PageHeader, Mono } from '@/components';
import { listShelvesWithOccupancy } from '@/features/shelves/queries';
import { SIZE_LABEL, type Size } from '@/features/items/format';

export default async function CategoriaPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const upper = code.toUpperCase();
  if (!['P', 'M', 'G'].includes(upper)) notFound();
  const cat = upper as Size;

  const shelves = (await listShelvesWithOccupancy()).filter((s) => s.categoryCode === cat);

  return (
    <>
      <PageHeader title={SIZE_LABEL[cat]} back />
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {shelves.length === 0 && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
            Nenhuma estante nesta categoria.
          </Typography>
        )}
        {shelves.map((s) => {
          const pct = s.capacity ? Math.round((s.occupied / s.capacity) * 100) : 0;
          return (
            <Card key={s.id}>
              <CardActionArea href={`/app/estantes/${s.id}`}>
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Mono variant="body1" sx={{ fontWeight: 700 }}>
                      {s.code}
                    </Mono>
                    <Typography variant="body2" color="text.secondary">
                      {s.occupied}/{s.capacity} · {pct}%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 4 }} />
                </Box>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>
    </>
  );
}
