'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Leitor de código de barras/QR pela câmera (câmera traseira quando disponível).
 * Exige HTTPS (ou localhost) e permissão de câmera. Sempre oferece digitação manual.
 */
export default function BarcodeScanner({
  open,
  onClose,
  onDetected,
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState('');

  const onDetectedRef = useRef(onDetected);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onDetectedRef.current = onDetected;
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } }, audio: false },
        videoRef.current!,
        (result, _err, controls) => {
          controlsRef.current = controls;
          if (result && !cancelled) {
            cancelled = true;
            controls.stop();
            onDetectedRef.current(result.getText());
            onCloseRef.current();
          }
        },
      )
      .then((controls) => {
        controlsRef.current = controls;
        setError(null);
      })
      .catch(() => {
        setError('Câmera indisponível (permissão negada ou sem acesso). Digite o código abaixo.');
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [open]);

  const submitManual = () => {
    const code = manual.trim();
    if (!code) return;
    setManual('');
    onDetectedRef.current(code);
    onCloseRef.current();
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { display: 'flex', flexDirection: 'column', bgcolor: 'black' } } }}
    >
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="Fechar" onClick={onClose}>
            <CloseIcon />
          </IconButton>
          <Typography variant="h2" color="inherit" sx={{ ml: 1 }}>
            Escanear código
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Área do vídeo — flex:1 garante altura dentro do Paper (flex column). */}
      <Box sx={{ position: 'relative', flex: 1, minHeight: 240, overflow: 'hidden' }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {!error && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '70%',
              aspectRatio: '3 / 2',
              border: '3px solid rgba(255,255,255,0.9)',
              borderRadius: 2,
              boxShadow: '0 0 0 100vmax rgba(0,0,0,0.4)',
              pointerEvents: 'none',
            }}
          />
        )}
      </Box>

      {/* Rodapé: erro (se houver) + digitação manual sempre disponível. */}
      <Box sx={{ bgcolor: 'background.paper', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {error && <Alert severity="warning">{error}</Alert>}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            label="Digitar código"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitManual();
              }
            }}
          />
          <Button variant="contained" onClick={submitManual} disabled={!manual.trim()}>
            Usar
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
