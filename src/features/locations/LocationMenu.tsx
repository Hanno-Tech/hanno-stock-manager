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
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Remover ${locationName}`}
        onClick={() => setConfirm(true)}
        className="text-muted-foreground"
      >
        <Trash2 className="size-5" />
      </Button>

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
