'use client';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import Mono from './Mono';

/**
 * Stepper de quantidade: botões grandes "+"/"-" (48×48) ladeando
 * um número central em JetBrains Mono, para contagem rápida.
 */
export default function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 9999,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, v)));
  const btnSx = {
    width: 48,
    height: 48,
    border: '1px solid #c3c6d7',
    borderRadius: 1,
    color: 'primary.main',
  };
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <IconButton aria-label="Diminuir" sx={btnSx} onClick={() => set(value - 1)} disabled={value <= min}>
        <RemoveIcon />
      </IconButton>
      <Mono variant="h2" sx={{ minWidth: 48, textAlign: 'center' }}>
        {value}
      </Mono>
      <IconButton aria-label="Aumentar" sx={btnSx} onClick={() => set(value + 1)} disabled={value >= max}>
        <AddIcon />
      </IconButton>
    </Box>
  );
}
