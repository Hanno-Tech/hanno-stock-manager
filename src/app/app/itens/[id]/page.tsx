import { notFound } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { PageHeader, Mono, StatusPill } from '@/components';
import { getItemById } from '@/features/items/queries';
import { requireUser } from '@/features/auth/queries';
import { SIZE_LABEL, statusPill, formatDateTime } from '@/features/items/format';
import ItemActions from '@/features/items/ItemActions';
import ItemPhoto from '@/features/items/ItemPhoto';

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const item = await getItemById(id, user.id);
  if (!item) notFound();

  const pill = statusPill(item.status);
  const positioned = item.shelfCode && item.positionLabel;

  return (
    <>
      <PageHeader title="Detalhes do Item" back />
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Cabeçalho: código + status */}
        <Card sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Código de rastreio
              </Typography>
              <Mono variant="h2">{item.trackingCode}</Mono>
            </Box>
            <StatusPill label={pill.label} tone={pill.tone} />
          </Box>
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Tamanho
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {SIZE_LABEL[item.sizeCode]}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {item.status === 'ENTREGUE' ? 'Entregue em' : 'Recebido em'}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {formatDateTime(item.deliveredAt ?? item.receivedAt)}
              </Typography>
            </Box>
          </Box>
        </Card>

        {/* Localização */}
        {positioned && (
          <Card sx={{ p: 3, bgcolor: 'primary.main', color: 'primary.contrastText', textAlign: 'center' }}>
            <PlaceOutlinedIcon />
            <Typography variant="overline" sx={{ display: 'block', mt: 1, opacity: 0.8 }}>
              Setor / Estante
            </Typography>
            <Mono variant="h1" sx={{ fontWeight: 700 }}>
              {item.shelfCode}
            </Mono>
            <Typography variant="overline" sx={{ display: 'block', mt: 2, opacity: 0.8 }}>
              Posição exata
            </Typography>
            <Mono variant="h1" sx={{ fontWeight: 700 }}>
              {item.positionLabel}
            </Mono>
          </Card>
        )}

        <ItemPhoto itemId={item.id} photoUrl={item.photoUrl} />

        {item.customerNote && (
          <Card sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Cliente / Observação
            </Typography>
            <Typography variant="body1">{item.customerNote}</Typography>
          </Card>
        )}

        {item.deliveredTo && (
          <Card sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Entregue a
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {item.deliveredTo}
            </Typography>
          </Card>
        )}

        {item.status === 'AGUARDANDO_RETIRADA' && <ItemActions itemId={item.id} />}
      </Box>
    </>
  );
}
