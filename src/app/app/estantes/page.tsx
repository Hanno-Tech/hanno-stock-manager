import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Fab from '@mui/material/Fab';
import LinearProgress from '@mui/material/LinearProgress';
import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { PageHeader, Mono } from '@/components';
import {
  listCategories,
  listShelvesWithOccupancy,
  listRecentActivity,
} from '@/features/shelves/queries';
import { formatDateTime } from '@/features/items/format';

const ACTIVITY_LABEL = {
  ENTRADA: 'Recebido',
  ENTREGA: 'Entregue',
  REPOSICIONAMENTO: 'Reposicionado',
} as const;

export default async function EstantesPage() {
  const [categories, shelves, activity] = await Promise.all([
    listCategories(),
    listShelvesWithOccupancy(),
    listRecentActivity(),
  ]);
  const totalShelves = shelves.length;

  return (
    <>
      <PageHeader title="Estantes" />
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Typography variant="h2">Visão Geral</Typography>
          <Typography variant="body2" color="text.secondary">
            {totalShelves} estantes
          </Typography>
        </Box>

        {/* Categorias */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {categories.map((c) => (
            <Card key={c.code}>
              <CardActionArea href={`/app/estantes/categoria/${c.code}`}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Mono variant="h2" color="primary" sx={{ fontWeight: 700, width: 32 }}>
                    {c.code}
                  </Mono>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {c.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {c.description} · {c.shelfCount} estantes
                    </Typography>
                  </Box>
                  <ChevronRightIcon color="action" />
                </Box>
              </CardActionArea>
            </Card>
          ))}
        </Box>

        {/* Todas as estantes com ocupação */}
        <Box>
          <Typography variant="h2" sx={{ mb: 1.5 }}>
            Todas as estantes
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
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
        </Box>

        {/* Atividade recente */}
        <Box>
          <Typography variant="overline" color="text.secondary">
            Atividade recente
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
            {activity.map((a) => (
              <Box key={a.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Mono variant="body2" sx={{ fontWeight: 600 }}>
                    {a.trackingCode}
                  </Mono>
                  <Typography variant="body2" color="text.secondary">
                    {ACTIVITY_LABEL[a.type]}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {formatDateTime(a.createdAt)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Fab
        href="/app/estantes/nova"
        color="primary"
        aria-label="Adicionar estante"
        sx={{ position: 'fixed', bottom: 'calc(80px + var(--safe-area-bottom))', right: 16 }}
      >
        <AddIcon />
      </Fab>
    </>
  );
}
