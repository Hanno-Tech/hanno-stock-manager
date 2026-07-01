'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SaveIcon from '@mui/icons-material/Save';
import { SegmentedControl, Mono, BarcodeScanner } from '@/components';
import { receiveItem, suggestPosition, type ReceiveState } from './actions';
import type { SuggestedPosition } from './receive';

type Size = 'P' | 'M' | 'G';

export default function ReceberForm() {
  const [state, formAction, saving] = useActionState<ReceiveState, FormData>(receiveItem, {});
  const [size, setSize] = useState<Size>('M');
  const [code, setCode] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestedPosition | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      setSuggestion(await suggestPosition(size));
    });
  }, [size]);

  return (
    <Box component="form" action={formAction} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {state.error && <Alert severity="error">{state.error}</Alert>}

      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Código lido
        </Typography>
        <TextField
          name="trackingCode"
          placeholder="ML-987234-A"
          required
          fullWidth
          value={code}
          onChange={(e) => setCode(e.target.value)}
          slotProps={{
            htmlInput: { style: { fontFamily: '"JetBrains Mono Variable", monospace' } },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton aria-label="Escanear código" onClick={() => setScannerOpen(true)} edge="end">
                    <QrCodeScannerIcon color="primary" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Tamanho
        </Typography>
        <input type="hidden" name="size" value={size} />
        <SegmentedControl<Size>
          value={size}
          onChange={setSize}
          options={[
            { value: 'P', label: 'P' },
            { value: 'M', label: 'M' },
            { value: 'G', label: 'G' },
          ]}
          ariaLabel="Tamanho do item"
        />
      </Box>

      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Posição sugerida
        </Typography>
        <Card
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: suggestion ? 'secondary.light' : 'action.hover',
            borderColor: 'transparent',
          }}
        >
          <PlaceOutlinedIcon color={suggestion ? 'success' : 'disabled'} />
          {suggestion ? (
            <Box>
              <Mono variant="body1" sx={{ fontWeight: 700 }}>
                {suggestion.shelfCode} · {suggestion.label}
              </Mono>
              <Typography variant="body2" color="text.secondary">
                {suggestion.aisle ? `Corredor ${suggestion.aisle}` : 'Sem corredor'}
                {suggestion.level ? `, Nível ${suggestion.level}` : ''}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Sem posições livres para o tamanho {size}
            </Typography>
          )}
        </Card>
      </Box>

      <TextField name="note" label="Nome do cliente / Obs (opcional)" fullWidth multiline minRows={1} />

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={saving || !suggestion}
        startIcon={<SaveIcon />}
      >
        {saving ? 'Salvando...' : 'Salvar Entrada'}
      </Button>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(c) => setCode(c)}
      />
    </Box>
  );
}
