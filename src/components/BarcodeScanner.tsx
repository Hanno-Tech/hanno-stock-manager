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
import CloseIcon from '@mui/icons-material/Close';

/**
 * Leitor de código de barras/QR pela câmera. Exige HTTPS (ou localhost) e
 * permissão de câmera. Em caso de falha, mostra aviso para digitar manualmente.
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

  // Mantém os callbacks em refs para o effect depender só de `open`
  // (evita reiniciar a câmera a cada render do componente pai).
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
      .decodeFromVideoDevice(undefined, videoRef.current!, (result, _err, controls) => {
        controlsRef.current = controls;
        if (result && !cancelled) {
          cancelled = true;
          controls.stop();
          onDetectedRef.current(result.getText());
          onCloseRef.current();
        }
      })
      .then((controls) => {
        controlsRef.current = controls;
        setError(null);
      })
      .catch(() => {
        setError('Não foi possível acessar a câmera. Verifique a permissão ou digite o código manualmente.');
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [open]);

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <AppBar position="sticky" color="primary" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="Fechar" onClick={onClose}>
            <CloseIcon />
          </IconButton>
          <Typography variant="h2" color="inherit" sx={{ ml: 1 }}>
            Escanear código
          </Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ position: 'relative', bgcolor: 'black', flex: 1, minHeight: 0 }}>
        <video
          ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          muted
          playsInline
        />
        {/* mira central */}
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
            }}
          />
        )}
        {error && (
          <Box sx={{ p: 3 }}>
            <Alert severity="warning">{error}</Alert>
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
