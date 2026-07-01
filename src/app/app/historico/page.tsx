import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
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
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Card sx={{ flex: 1, p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Entregues hoje
            </Typography>
            <Mono variant="h1" color="primary" sx={{ fontWeight: 700 }}>
              {stats.today}
            </Mono>
          </Card>
          <Card sx={{ flex: 1, p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Este mês
            </Typography>
            <Mono variant="h1" sx={{ fontWeight: 700 }}>
              {stats.month}
            </Mono>
          </Card>
        </Box>

        {deliveries.length === 0 && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
            Nenhuma entrega registrada.
          </Typography>
        )}

        {groups.map((g) => (
          <Box key={g.bucket}>
            <Typography variant="overline" color="text.secondary">
              {g.bucket}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
              {g.rows.map((r) => (
                <Card key={r.id} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Mono variant="body1" sx={{ fontWeight: 700 }}>
                      {r.trackingCode}
                    </Mono>
                    <Typography variant="body2" color="text.secondary">
                      {time(r.createdAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <StatusPill label={r.sizeCode} tone="info" />
                    {r.deliveredTo ? (
                      <Typography variant="body2" color="text.secondary">
                        Entregue a: {r.deliveredTo}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Sem registro
                      </Typography>
                    )}
                    <CheckCircleOutlineIcon color="success" fontSize="small" sx={{ ml: 'auto' }} />
                  </Box>
                </Card>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </>
  );
}
