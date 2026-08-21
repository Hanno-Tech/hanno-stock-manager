'use client';

import { useState, useTransition } from 'react';
import { Ban, CreditCard, RefreshCw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  cancelSubscriptionAction,
  changeCardAction,
  startCheckoutAction,
  type BillingActionState,
} from './actions';

/**
 * Autoatendimento da assinatura. O cartão é sempre coletado na página do Asaas
 * — daqui só saem redirecionamentos para lá, nunca campos de cartão.
 */
export default function BillingActions({
  temAssinatura,
  avisoCancelamento,
  rotuloAssinar = 'Assinar com cartão',
}: {
  /** Já existe assinatura aberta no Asaas. */
  temAssinatura: boolean;
  /** O que acontece com o acesso ao cancelar — montado no servidor, que sabe
   *  se a conta está no teste, em dia ou devendo. */
  avisoCancelamento: string;
  rotuloAssinar?: string;
}) {
  const [cancelAberto, setCancelAberto] = useState(false);
  const [resultado, setResultado] = useState<BillingActionState>({});
  const [pending, startTransition] = useTransition();

  // As ações que dão certo terminam em `redirect`, então só volta resultado
  // quando algo falhou — ou no cancelamento, que fica na mesma tela.
  const rodar = (fn: () => Promise<BillingActionState>, fechar?: () => void) =>
    startTransition(async () => {
      const r = (await fn()) ?? {};
      setResultado(r);
      if (!r.error) fechar?.();
    });

  return (
    <div className="mt-4 flex flex-col gap-2">
      {resultado.error && (
        <p className="flex items-start gap-2 rounded-lg bg-red-100 p-3 text-sm text-red-900">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {resultado.error}
        </p>
      )}

      {temAssinatura ? (
        <>
          <Button
            variant="outline"
            className="w-full"
            disabled={pending}
            onClick={() => rodar(changeCardAction)}
          >
            <RefreshCw />
            {pending ? 'Abrindo...' : 'Trocar cartão'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-destructive"
            onClick={() => setCancelAberto(true)}
          >
            Cancelar assinatura
          </Button>
        </>
      ) : (
        <Button
          size="lg"
          className="w-full"
          disabled={pending}
          onClick={() => rodar(startCheckoutAction)}
        >
          <CreditCard />
          {pending ? 'Abrindo pagamento...' : rotuloAssinar}
        </Button>
      )}

      <Dialog open={cancelAberto} onOpenChange={setCancelAberto}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancelar assinatura?</DialogTitle>
            <DialogDescription>{avisoCancelamento}</DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setCancelAberto(false)} disabled={pending}>
              Voltar
            </Button>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={pending}
              onClick={() => rodar(cancelSubscriptionAction, () => setCancelAberto(false))}
            >
              <Ban />
              {pending ? 'Cancelando...' : 'Cancelar assinatura'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
