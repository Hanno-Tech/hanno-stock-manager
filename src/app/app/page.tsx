import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { PageHeader, Mono } from '@/components';
import DashboardSearch from '@/features/dashboard/DashboardSearch';
import { getDashboardStats } from '@/features/dashboard/queries';

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card sx={{ flex: 1, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 1 }}>
        {icon}
        <Typography variant="body2">{label}</Typography>
      </Box>
      <Mono variant="h1" sx={{ color, fontWeight: 700 }}>
        {value}
      </Mono>
    </Card>
  );
}

function SizeCard({ code, qty }: { code: 'P' | 'M' | 'G'; qty: number }) {
  return (
    <Card sx={{ flex: 1, p: 2, textAlign: 'center' }}>
      <Mono variant="h2" color="primary" sx={{ fontWeight: 700 }}>
        {code}
      </Mono>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        {qty}
      </Typography>
    </Card>
  );
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <>
      <PageHeader title="Estoque Rápido" />
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <DashboardSearch />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <KpiCard
            icon={<Inventory2OutlinedIcon fontSize="small" />}
            label="Total em Estoque"
            value={stats.totalInStock}
            color="primary.main"
          />
          <KpiCard
            icon={<CheckCircleOutlineIcon fontSize="small" />}
            label="Recebidos Hoje"
            value={stats.receivedToday}
            color="secondary.main"
          />
        </Box>

        <Box>
          <Typography variant="h2" sx={{ mb: 1.5 }}>
            Distribuição por Tamanho
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <SizeCard code="P" qty={stats.bySize.P} />
            <SizeCard code="M" qty={stats.bySize.M} />
            <SizeCard code="G" qty={stats.bySize.G} />
          </Box>
        </Box>

        <Button
          href="/app/receber"
          variant="contained"
          size="large"
          fullWidth
          startIcon={<QrCodeScannerIcon />}
          sx={{ mt: 1 }}
        >
          Receber Mercadoria
        </Button>
      </Box>
    </>
  );
}
