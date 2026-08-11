'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { deleteLocation } from './actions';

export default function LocationMenu({
  locationId,
  locationName,
}: {
  locationId: string;
  locationName: string;
}) {
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      {/* Herda o quase-preto do header amarelo — texto claro sumiria ali. */}
      <button
        type="button"
        aria-label={`Remover ${locationName}`}
        onClick={() => setConfirm(true)}
        className="flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-black/10 active:bg-black/15"
      >
        <Trash2 className="size-5" />
      </button>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover {locationName}?</DialogTitle>
            <DialogDescription>
              Todas as vagas deste local serão removidas. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirm(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => startTransition(() => deleteLocation(locationId))}
            >
              {pending ? 'Removendo...' : 'Remover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
