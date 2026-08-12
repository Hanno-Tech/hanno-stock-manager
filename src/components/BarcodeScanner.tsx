'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { X, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseScan, type ParsedScan } from '@/lib/scan/parse';

/**
 * Leitor de código de barras/QR pela câmera (traseira quando disponível).
 * Exige HTTPS (ou localhost) e permissão de câmera. A digitação manual fica
 * SEMPRE visível: em agência com luz ruim ou etiqueta amassada, é o caminho
 * que salva o atendimento.
 */
export default function BarcodeScanner({
  open,
  onClose,
  onDetected,
}: {
  open: boolean;
  onClose: () => void;
  /** Recebe a leitura já normalizada — ver src/lib/scan/parse.ts. */
  onDetected: (scan: ParsedScan) => void;
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
    let stream: MediaStream | null = null;
    const reader = new BrowserMultiFormatReader();

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Este navegador não expõe a câmera (é preciso HTTPS).');
        }
        // Pedimos a câmera nós mesmos: garante o prompt de permissão e erros claros.
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setError(null);
        controlsRef.current = await reader.decodeFromStream(
          stream,
          videoRef.current!,
          (result, _err, controls) => {
            if (result && !cancelled) {
              cancelled = true;
              controls.stop();
              onDetectedRef.current(parseScan(result.getText()));
              onCloseRef.current();
            }
          },
        );
      } catch (e) {
        const err = e as Error;
        setError(
          `Câmera indisponível (${err?.name || 'erro'}: ${err?.message || ''}). Digite o código abaixo.`,
        );
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open]);

  // Fecha no Esc — o Dialog do MUI dava isso de graça; aqui é explícito.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const submitManual = () => {
    const code = manual.trim();
    if (!code) return;
    setManual('');
    // Passa pelo mesmo parser: o operador pode colar um payload JSON inteiro.
    onDetectedRef.current(parseScan(code));
    onCloseRef.current();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Escanear código"
      className="fixed inset-0 z-50 flex flex-col bg-black"
    >
      <div className="pt-safe flex min-h-14 items-center gap-2 bg-ml-yellow px-2 text-ml-yellow-on">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Fechar"
          onClick={onClose}
          className="text-ml-yellow-on hover:bg-black/10 hover:text-ml-yellow-on"
        >
          <X />
        </Button>
        <span className="font-heading text-lg font-bold">Escanear código</span>
      </div>

      {/* Área do vídeo — flex-1 garante altura dentro da coluna flex. */}
      <div className="relative min-h-60 flex-1 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="size-full object-cover"
        />
        {!error && (
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 aspect-3/2 w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-lg border-[3px] border-white/90 shadow-[0_0_0_100vmax_rgb(0_0_0/0.4)]"
          />
        )}
      </div>

      {/* Rodapé: erro (se houver) + digitação manual sempre disponível. */}
      <div className="pb-safe flex flex-col gap-3 bg-card p-4">
        {error && (
          <p className="flex items-start gap-2 rounded-lg bg-amber-100 p-3 text-sm text-amber-900">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Input
            aria-label="Digitar código"
            placeholder="Digitar código"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitManual();
              }
            }}
            className="font-mono"
          />
          <Button onClick={submitManual} disabled={!manual.trim()}>
            Usar
          </Button>
        </div>
      </div>
    </div>
  );
}
