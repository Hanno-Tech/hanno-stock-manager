'use client';

import { useEffect, useState, useTransition } from 'react';
import { Ban, CreditCard, ExternalLink, RefreshCw, TriangleAlert } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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

  // As ações que abrem pagamento devolvem o link do Asaas em vez de redirecionar
  // do servidor: a navegação para outra origem tem de sair daqui, onde dá para
  // deixar um link tocável na tela se o navegador não a executar — é o que
  // acontece no app instalado como PWA, que entrega ao sistema a navegação para
  // fora do `scope` do manifesto.
  const rodar = (fn: () => Promise<BillingActionState>, fechar?: () => void) =>
    startTransition(async () => {
      let r: BillingActionState;
      try {
        r = (await fn()) ?? {};
      } catch {
        setResultado({ error: 'Não foi possível falar com o servidor. Tente de novo.' });
        return;
      }
      setResultado(r);
      if (!r.error) fechar?.();
    });

  // A navegação sai de um efeito, e não de dentro da transição, para o link do
  // plano B já estar no DOM quando ela começar: se o navegador engolir a
  // navegação, a pessoa encontra o link em vez de uma tela parada.
  const link = resultado.link;
  useEffect(() => {
    if (link) window.location.assign(link);
  }, [link]);

  return (
    <div className="mt-4 flex flex-col gap-2">
      {resultado.error && (
        <p className="flex items-start gap-2 rounded-lg bg-red-100 p-3 text-sm text-red-900">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {resultado.error}
        </p>
      )}

      {/* Plano B: se a navegação automática não acontecer, a pessoa toca no
          link. Um clique em âncora é a única forma de sair do app instalado
          que todo navegador respeita. */}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full')}
        >
          Abrir a página de pagamento
          <ExternalLink className="size-3.5 opacity-70" />
        </a>
      )}

      {temAssinatura ? (
        <>
          <Button
            variant="outline"
            className="w-full"
            disabled={pending || !!link}
            onClick={() => rodar(changeCardAction)}
          >
            <RefreshCw />
            {pending || link ? 'Abrindo...' : 'Trocar cartão'}
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
          disabled={pending || !!link}
          onClick={() => rodar(startCheckoutAction)}
        >
          <CreditCard />
          {pending || link ? 'Abrindo pagamento...' : rotuloAssinar}
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
