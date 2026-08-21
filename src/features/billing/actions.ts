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

export type BillingActionState = { error?: string; ok?: string };

/** Mensagem que a agência entende, sem vazar detalhe de integração. */
const mensagem = (e: unknown, fallback: string): string =>
  e instanceof AsaasError ? e.message : fallback;

function revalidar() {
  revalidatePath('/assinatura');
  revalidatePath('/app/perfil');
}

/**
 * Abre o checkout e manda a agência para a página do Asaas. O `redirect` sai
 * daqui, e não do cliente, para o link nunca ficar exposto antes da hora.
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
  redirect(link);
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
  redirect(link);
}
