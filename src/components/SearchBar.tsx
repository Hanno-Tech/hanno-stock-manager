'use client';

import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

/**
 * Barra de busca persistente (altura mínima 56px) com ícone de "scan"
 * na borda direita para acesso rápido à câmera/leitor.
 */
export default function SearchBar({
  value,
  onChange,
  onScan,
  placeholder = 'Buscar código...',
}: {
  value?: string;
  onChange?: (value: string) => void;
  onScan?: () => void;
  placeholder?: string;
}) {
  return (
    <TextField
      fullWidth
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      slotProps={{
        input: {
          sx: { minHeight: 56, borderRadius: 2, bgcolor: 'background.paper' },
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: onScan ? (
            <InputAdornment position="end">
              <IconButton aria-label="Escanear código" onClick={onScan} edge="end">
                <QrCodeScannerIcon color="primary" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        },
      }}
    />
  );
}
