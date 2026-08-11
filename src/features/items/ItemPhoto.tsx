'use client';

import { useActionState, useRef } from 'react';
import { Camera, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadItemPhoto, type PhotoState } from './actions';

export default function ItemPhoto({
  itemId,
  photoUrl,
}: {
  itemId: string;
  photoUrl: string | null;
}) {
  const action = uploadItemPhoto.bind(null, itemId);
  const [state, formAction, pending] = useActionState<PhotoState, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="rounded-lg bg-card p-4">
      <form ref={formRef} action={formAction} className="flex flex-col gap-3">
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
          ref={(el) => {
            if (el) el.value = '';
          }}
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          hidden
          id={`photo-${itemId}`}
          onChange={() => formRef.current?.requestSubmit()}
        />
        <Button
          variant="outline"
          disabled={pending}
          nativeButton={false}
          render={<label htmlFor={`photo-${itemId}`} />}
          className="cursor-pointer"
        >
          <Camera />
          {pending ? 'Enviando...' : photoUrl ? 'Trocar foto' : 'Adicionar foto'}
        </Button>
      </form>
    </div>
  );
}
