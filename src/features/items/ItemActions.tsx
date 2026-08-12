'use client';

import { useState, useTransition } from 'react';
import { CircleCheck, ScanLine, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BarcodeScanner, Mono } from '@/components';
import { confirmDelivery } from '@/features/movements/actions';

export default function ItemActions({
  itemId,
  customerName,
}: {
  itemId: string;
  customerName: string | null;
}) {
  const [open, setOpen] = useState(false);
  // Já vem com o nome do cadastro: no caso normal o operador só confirma.
  const [to, setTo] = useState(customerName ?? '');
  const [phrase, setPhrase] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      await confirmDelivery(itemId, to, phrase);
      setOpen(false);
      setPhrase('');
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
            <DialogDescription>
              Bipe o QR do cliente para registrar o código de retirada usado.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {phrase ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3">
                <Check className="size-4 shrink-0 text-ml-success-action" />
                <div className="min-w-0">
                  <p className="text-[0.6875rem] font-bold tracking-wider text-muted-foreground uppercase">
                    Código de retirada
                  </p>
                  <Mono className="block truncate text-sm font-bold">{phrase}</Mono>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setScannerOpen(true)}>
                <ScanLine />
                Bipar QR do cliente
              </Button>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="deliveredTo">Entregue a</Label>
              <Input
                id="deliveredTo"
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

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(scan) => setPhrase(scan.value)}
      />
    </>
  );
}
