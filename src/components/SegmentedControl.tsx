'use client';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

export type SegmentOption<T extends string> = { value: T; label: string };

/**
 * Controle segmentado (ex.: Tamanho P/M/G ou filtros de status).
 * Estado ativo em cor primária com texto branco; inativos em cinza-claro.
 */
export default function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T | null;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  ariaLabel?: string;
}) {
  return (
    <ToggleButtonGroup
      exclusive
      fullWidth
      value={value}
      aria-label={ariaLabel}
      onChange={(_, v: T | null) => {
        if (v !== null) onChange(v);
      }}
      sx={{
        gap: 1,
        '& .MuiToggleButton-root': {
          border: '1px solid #c3c6d7',
          borderRadius: 1,
          minHeight: 48,
          fontWeight: 700,
          color: 'text.secondary',
          bgcolor: '#eff4ff',
          '&.Mui-selected': {
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'primary.dark' },
          },
        },
      }}
    >
      {options.map((opt) => (
        <ToggleButton key={opt.value} value={opt.value}>
          {opt.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
