'use client';

import { useActionState, useState, startTransition, type ChangeEvent } from 'react';
import { Camera, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadItemPhoto, type PhotoState } from './actions';

/** Lado maior da imagem enviada. Suficiente para identificar a mercadoria no balcão. */
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

/**
 * Redimensiona e recomprime a foto no navegador. A câmera do celular gera 2–4 MB,
 * acima do limite dos Server Actions — e subir isso no 4G do balcão é lento.
 * Se qualquer etapa falhar, devolve o arquivo original e deixa o servidor validar.
 */
async function shrink(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  );
  // Recomprimir pode engordar imagens já pequenas — nesse caso o original vence.
  if (!blob || blob.size >= file.size) return file;

  return new File([blob], 'foto.jpg', { type: 'image/jpeg' });
}

export default function ItemPhoto({
  itemId,
  photoUrl,
}: {
  itemId: string;
  photoUrl: string | null;
}) {
  const action = uploadItemPhoto.bind(null, itemId);
  const [state, formAction, uploading] = useActionState<PhotoState, FormData>(action, {});
  const [preparing, setPreparing] = useState(false);
  const busy = preparing || uploading;

  async function handlePick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // permite escolher o mesmo arquivo de novo
    if (!file) return;

    setPreparing(true);
    const prepared = await shrink(file).catch(() => file);
    setPreparing(false);

    const formData = new FormData();
    formData.set('photo', prepared);
    startTransition(() => formAction(formData));
  }

  return (
    <div className="rounded-lg bg-card p-4">
      <div className="flex flex-col gap-3">
        {state.error && (
          <p className="flex items-start gap-2 rounded-lg bg-red-100 p-3 text-sm text-red-900">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {state.error}
          </p>
        )}

        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="Foto da mercadoria"
            className="max-h-70 w-full rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
            <Camera className="size-6" />
          </div>
        )}

        <input
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          hidden
          id={`photo-${itemId}`}
          disabled={busy}
          onChange={handlePick}
        />
        <Button
          variant="outline"
          disabled={busy}
          nativeButton={false}
          render={<label htmlFor={`photo-${itemId}`} />}
          className="cursor-pointer"
        >
          <Camera />
          {preparing
            ? 'Preparando...'
            : uploading
              ? 'Enviando...'
              : photoUrl
                ? 'Trocar foto'
                : 'Adicionar foto'}
        </Button>
      </div>
    </div>
  );
}
