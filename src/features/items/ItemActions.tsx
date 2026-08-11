'use client';

import { useState, useTransition } from 'react';
import { CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { confirmDelivery } from '@/features/movements/actions';

export default function ItemActions({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState('');
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      await confirmDelivery(itemId, to);
      setOpen(false);
    });
  };

  return (
    <>
      <Button
        size="lg"
        className="w-full bg-ml-success-action text-white hover:bg-ml-success-action/90"
        onClick={() => setOpen(true)}
      >
        <CircleCheck />
        Confirmar Entrega
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar entrega</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="deliveredTo">Entregue a (opcional)</Label>
            <Input
              id="deliveredTo"
              autoFocus
              value={to}
              onChange={(e) => setTo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submit();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              onClick={submit}
              disabled={pending}
              className="bg-ml-success-action text-white hover:bg-ml-success-action/90"
            >
              {pending ? 'Confirmando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
