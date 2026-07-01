import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Mono from './Mono';
import StatusPill from './StatusPill';

type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

/**
 * Card de item de inventário: SKU em JetBrains Mono no topo à direita,
 * título/subtítulo à esquerda e pill de status opcional.
 */
export default function InventoryCard({
  sku,
  title,
  subtitle,
  status,
  href,
}: {
  sku: string;
  title: string;
  subtitle?: string;
  status?: { label: string; tone: Tone };
  href?: string;
}) {
  const content = (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, p: 2, width: '100%' }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body1" noWrap sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" noWrap>
            {subtitle}
          </Typography>
        )}
        {status && (
          <Box sx={{ mt: 1 }}>
            <StatusPill label={status.label} tone={status.tone} />
          </Box>
        )}
      </Box>
      <Mono variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        {sku}
      </Mono>
    </Box>
  );

  return (
    <Card>
      {href ? (
        <CardActionArea href={href}>
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  );
}
