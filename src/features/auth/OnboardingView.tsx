'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import QrCodeScannerOutlinedIcon from '@mui/icons-material/QrCodeScannerOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { completeOnboardingAction } from './actions';

const STEPS = [
  { icon: <QrCodeScannerOutlinedIcon fontSize="large" />, title: 'Escaneie e receba', desc: 'Leia o código da mercadoria e classifique por tamanho em segundos.' },
  { icon: <PlaceOutlinedIcon fontSize="large" />, title: 'Posição sugerida', desc: 'O app indica a melhor estante e posição livre para o item.' },
  { icon: <Inventory2OutlinedIcon fontSize="large" />, title: 'Entregue com rastreio', desc: 'Confirme retiradas e acompanhe o histórico de entregas.' },
];

export default function OnboardingView({ name }: { name: string }) {
  return (
    <Box>
      <Typography variant="h1" color="primary" sx={{ mb: 1 }}>
        Bem-vindo, {name.split(' ')[0]}!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Veja como funciona o Estoque Rápido.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 5 }}>
        {STEPS.map((s) => (
          <Box key={s.title} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Box sx={{ color: 'primary.main', mt: 0.5 }}>{s.icon}</Box>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                {s.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {s.desc}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Box component="form" action={completeOnboardingAction}>
        <Button type="submit" variant="contained" size="large" fullWidth>
          Começar
        </Button>
      </Box>
    </Box>
  );
}
