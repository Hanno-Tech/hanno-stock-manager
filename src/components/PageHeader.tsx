'use client';

import { useRouter } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

/** Cabeçalho de página: título centralizado, botão voltar opcional e ações à direita. */
export default function PageHeader({
  title,
  back = false,
  actions,
}: {
  title: string;
  back?: boolean;
  actions?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{ bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Toolbar sx={{ gap: 1 }}>
        {back && (
          <IconButton edge="start" aria-label="Voltar" onClick={() => router.back()}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography variant="h2" color="primary" sx={{ flex: 1, textAlign: back ? 'center' : 'left' }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>{actions}</Box>
      </Toolbar>
    </AppBar>
  );
}
