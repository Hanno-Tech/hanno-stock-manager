'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/features/auth/queries';
import { AsaasError } from '@/lib/billing/asaas';
import {
  cancelSubscription,
  getSubscription,
  reconcileCheckout,
  startCheckout,
  syncSubscription,
} from './subscription';

export type BillingActionState = {
  error?: string;
  ok?: string;
  /** Página de pagamento do Asaas. Quem navega até lá é o cliente. */
  link?: string;
};

/**
 * O que a agência lê quando algo falha. Só repassa a mensagem do erro quando
 * ela foi marcada como pública; qualquer outra coisa vira o texto genérico e o
 * detalhe fica no log. Falha de configuração não é assunto de quem usa o app.
 */
function mensagem(e: unknown, fallback: string): string {
  if (e instanceof AsaasError && e.publico) return e.message;
  console.error('[cobrança]', e);
  return fallback;
}

function revalidar() {
  revalidatePath('/assinatura');
  revalidatePath('/app/perfil');
}

/**
 * Abre o checkout e devolve o endereço da página do Asaas.
 *
 * Devolve em vez de `redirect`: o Asaas é outra origem, e um `redirect` externo
 * vindo de Server Action vira uma navegação de página inteira disparada de
 * dentro do render do App Router (`location.assign`), que a ação nunca vê
 * acontecer. Se o navegador não executar — é o caso do app instalado como PWA,
 * onde sair do `scope` do manifesto fica a cargo do sistema — o botão trava em
 * "Abrindo pagamento..." para sempre, sem erro e sem saída. Com o link na mão,
 * o cliente navega e ainda mostra um link tocável como plano B.
 */
export async function startCheckoutAction(): Promise<BillingActionState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  let link: string;
  try {
    link = await startCheckout(user);
  } catch (e) {
    return { error: mensagem(e, 'Não foi possível abrir o pagamento agora.') };
  }

  revalidar();
  return { link };
}

/**
 * Confere o que já existe no Asaas e tenta entrar no app: adota a assinatura
 * que o checkout criou e relê as cobranças. É o caminho da volta do pagamento
 * e do botão "Já paguei" — funciona mesmo sem webhook.
 */
export async function recheckBillingAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const sub = await getSubscription(user.id);
  if (sub) {
    const adotada = await reconcileCheckout(user, sub).catch(() => sub);
    await syncSubscription(adotada).catch(() => null);
  }

  revalidar();
  redirect('/app');
}

/**
 * Cancela a assinatura. Quem já pagou o mês continua usando até o fim dele — o
 * `paidThrough` não é mexido.
 */
export async function cancelSubscriptionAction(): Promise<BillingActionState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const sub = await getSubscription(user.id);
  if (!sub) return { error: 'Esta conta não tem assinatura para cancelar' };

  try {
    await cancelSubscription(sub);
  } catch (e) {
    return { error: mensagem(e, 'Não foi possível cancelar agora. Tente de novo.') };
  }

  revalidar();
  return { ok: 'Assinatura cancelada' };
}

/**
 * Trocar cartão. O checkout hospedado não devolve token para nós, então a única
 * forma de trocar o cartão sem coletá-lo aqui é encerrar a assinatura e abrir
 * outra — o acesso já pago continua valendo enquanto isso.
 */
export async function changeCardAction(): Promise<BillingActionState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const sub = await getSubscription(user.id);
  if (!sub) return { error: 'Esta conta não tem assinatura' };

  let link: string;
  try {
    if (sub.asaasSubscriptionId) await cancelSubscription(sub);
    link = await startCheckout(user);
  } catch (e) {
    return { error: mensagem(e, 'Não foi possível trocar o cartão agora.') };
  }

  revalidar();
  return { link };
}
