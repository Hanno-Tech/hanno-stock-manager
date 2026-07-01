'use client';

import { usePathname, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import QrCodeScannerOutlinedIcon from '@mui/icons-material/QrCodeScannerOutlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';

const TABS = [
  { label: 'Início', value: '/app', icon: <HomeOutlinedIcon /> },
  { label: 'Receber', value: '/app/receber', icon: <QrCodeScannerOutlinedIcon /> },
  { label: 'Estantes', value: '/app/estantes', icon: <WarehouseOutlinedIcon /> },
  { label: 'Histórico', value: '/app/historico', icon: <HistoryOutlinedIcon /> },
  { label: 'Perfil', value: '/app/perfil', icon: <PersonOutlineOutlinedIcon /> },
];

const NAV_HEIGHT = 64;

/** Casca da área autenticada: conteúdo rolável + navegação inferior fixa (thumb zone). */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Seleciona a aba pelo prefixo mais específico que casa com a rota atual.
  const current =
    TABS.map((t) => t.value)
      .filter((v) => (v === '/app' ? pathname === '/app' : pathname.startsWith(v)))
      .sort((a, b) => b.length - a.length)[0] ?? false;

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Box
        component="main"
        sx={{ pb: `calc(${NAV_HEIGHT}px + var(--safe-area-bottom) + 16px)`, maxWidth: 480, mx: 'auto' }}
      >
        {children}
      </Box>

      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: 480,
          mx: 'auto',
          borderTop: '1px solid',
          borderColor: 'divider',
          pb: 'var(--safe-area-bottom)',
          zIndex: (t) => t.zIndex.appBar,
        }}
      >
        <BottomNavigation
          showLabels
          value={current}
          onChange={(_, value: string) => router.push(value)}
          sx={{ height: NAV_HEIGHT, bgcolor: 'background.paper', '& .MuiBottomNavigationAction-label': { fontSize: '0.7rem' } }}
        >
          {TABS.map((t) => (
            <BottomNavigationAction
              key={t.value}
              label={t.label}
              value={t.value}
              icon={t.icon}
              sx={{ minWidth: 0 }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
