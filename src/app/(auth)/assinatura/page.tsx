import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CheckCircle2, Lock, RefreshCw, TriangleAlert } from 'lucide-react';
import { Logo, Mono } from '@/components';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/features/auth/queries';
import { logoutAction } from '@/features/auth/actions';
import { getBillingState } from '@/features/billing/access';
import { getSubscription, reconcileCheckout, syncSubscription } from '@/features/billing/subscription';
import { recheckBillingAction } from '@/features/billing/actions';
import BillingActions from '@/features/billing/BillingActions';
import { PLANO, VALOR_FORMATADO } from '@/lib/billing/plan';

export const metadata: Metadata = { title: 'Assinatura — Doca' };

const INCLUSO = [
  'Recebimento pelo QR do pacote',
  'Locais criados por você',
  'Busca por nome do cliente',
  'Foto e registro de retirada',
];

/**
 * Tela em que o app trava quando o teste acaba, e por onde a assinatura começa.
 * O cartão é coletado na página hospedada do Asaas — o Doca só manda a agência
 * para lá e reconhece a assinatura quando ela volta.
 */
export default async function AssinaturaPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { checkout } = await searchParams;

  // Volta do pagamento: adota a assinatura que o checkout criou. Roda antes de
  // decidir o que mostrar, e é o que faz o fluxo fechar mesmo sem webhook.
  if (checkout === 'ok') {
    const sub = await getSubscription(user.id);
    if (sub) {
      const adotada = await reconcileCheckout(user, sub).catch(() => sub);
      await syncSubscription(adotada).catch(() => null);
    }
  }

  const state = await getBillingState(user);
  if (state.allowed) redirect('/app');

  const cancelada = state.subscription?.status === 'CANCELADA';
  const venceu = state.kind === 'VENCIDA';

  const titulo = cancelada
    ? 'Assinatura cancelada'
    : venceu
      ? 'Sua mensalidade venceu'
      : 'Seu teste grátis acabou';

  const subtitulo = cancelada
    ? 'Você cancelou a renovação. Assine de novo para voltar a usar o Doca.'
    : venceu
      ? 'A renovação no cartão não passou. Assine de novo para destravar o app.'
      : `Foram ${PLANO.trialDias} dias por conta da casa. Para continuar, assine com cartão.`;

  const aviso =
    checkout === 'cancelado'
      ? 'Você saiu do pagamento antes de concluir. Nada foi cobrado.'
      : checkout === 'expirado'
        ? 'O link de pagamento expirou. Toque em assinar para gerar outro.'
        : checkout === 'ok'
          ? 'Recebemos seu retorno do Asaas, mas o pagamento ainda não foi confirmado. Toque em “Já paguei” em alguns instantes.'
          : null;

  return (
    <div>
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Logo className="size-12" />
        <span className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-900">
          <Lock className="size-6" />
        </span>
        <h1 className="font-heading text-2xl font-bold">{titulo}</h1>
        <p className="text-muted-foreground">{subtitulo}</p>
      </div>

      <div className="rounded-xl bg-ml-yellow p-6 text-ml-yellow-on">
        <p className="text-sm font-bold tracking-wide uppercase opacity-80">Plano único</p>
        <p className="mt-3 flex items-baseline gap-1.5">
          <span className="text-lg font-bold">R$</span>
          <Mono className="text-4xl leading-none font-bold tracking-[-0.06em]">
            {VALOR_FORMATADO.replace('R$', '').trim()}
          </Mono>
          <span className="text-base font-semibold">/mês</span>
        </p>
        <p className="mt-3 text-sm font-medium">
          Renova sozinho no cartão. Cancele quando quiser, pelo Perfil.
        </p>
        <ul className="mt-4 flex flex-col gap-1.5 text-sm">
          {INCLUSO.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {aviso && (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-100 p-3 text-sm text-amber-900">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {aviso}
        </p>
      )}

      <BillingActions temAssinatura={false} avisoCancelamento="" />

      {/* O pagamento no cartão é confirmado em segundos, mas o webhook pode
          demorar (ou não existir em dev): isto relê o Asaas e destrava. */}
      <form action={recheckBillingAction} className="mt-2">
        <Button type="submit" variant="outline" size="lg" className="w-full">
          <RefreshCw />
          Já paguei
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        O pagamento acontece na página do Asaas. Os dados do cartão não passam pelo Doca.
      </p>

      <form action={logoutAction} className="mt-4">
        <Button type="submit" variant="ghost" size="sm" className="w-full text-muted-foreground">
          Sair da conta
        </Button>
      </form>
    </div>
  );
}
