import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { eq, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import { subscriptions, type Subscription, type User } from '@/db/schema';
import { env } from '@/lib/env';
import { PLANO, VALOR_REAIS, dataAsaas } from '@/lib/billing/plan';
import { stateFromPayments, type SubscriptionState } from '@/lib/billing/state';
import * as asaas from '@/lib/billing/asaas';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A linha de cobrança da conta (uma por agência) ou null. */
export async function getSubscription(ownerId: string): Promise<Subscription | null> {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.ownerId, ownerId))
    .limit(1);
  return row ?? null;
}

/** Assinatura de verdade é a que está aberta no Asaas — teste e cancelada, não. */
export const temAssinaturaAtiva = (sub: Subscription | null): boolean =>
  !!sub?.asaasSubscriptionId && sub.status !== 'CANCELADA';

async function linhaDaConta(ownerId: string): Promise<Subscription> {
  const existente = await getSubscription(ownerId);
  if (existente) return existente;

  const [row] = await db
    .insert(subscriptions)
    .values({ ownerId, valueCents: PLANO.valorCentavos, billingType: PLANO.billingType })
    .onConflictDoNothing({ target: subscriptions.ownerId })
    .returning();
  // Corrida entre duas chamadas: o unique de owner_id barra o segundo insert.
  return row ?? (await getSubscription(ownerId))!;
}

// A página de pagamento exige uma imagem do item. É sempre a mesma; ler o
// arquivo uma vez por processo evita I/O em cada checkout.
let logoBase64: string | undefined;
async function logo(): Promise<string> {
  logoBase64 ??= await readFile(join(process.cwd(), 'public', 'icon-192.png'), 'base64');
  return logoBase64;
}

/**
 * A URL pública do app. O Asaas recusa `localhost` nos callbacks do checkout,
 * então em desenvolvimento é preciso apontar `APP_URL` para um túnel.
 */
function urlBase(): string {
  const url = env.APP_URL ?? env.AUTH_URL;
  if (!url || url.includes('localhost') || url.includes('127.0.0.1')) {
    // Detalhe só no log: qual variável falta é problema de quem opera o app.
    throw asaas.falhaAsaas(
      'o checkout exige URL pública — defina APP_URL (em dev, a URL de um túnel)',
    );
  }
  return url.replace(/\/$/, '');
}

/**
 * Abre a página de pagamento hospedada e devolve o link para onde a agência
 * deve ir. Guardamos o id do checkout porque é a única chave que liga o evento
 * `CHECKOUT_PAID` de volta a esta conta — o Asaas não expõe consulta de
 * checkout depois de criado.
 */
export async function startCheckout(user: User): Promise<string> {
  const sub = await linhaDaConta(user.id);
  if (temAssinaturaAtiva(sub)) {
    throw new asaas.AsaasError('Esta conta já tem assinatura ativa.');
  }

  const base = urlBase();
  const checkout = await asaas.createCheckout({
    externalReference: user.id,
    minutesToExpire: PLANO.checkoutExpiraMin,
    callback: {
      successUrl: `${base}/assinatura?checkout=ok`,
      cancelUrl: `${base}/assinatura?checkout=cancelado`,
      expiredUrl: `${base}/assinatura?checkout=expirado`,
    },
    item: { name: PLANO.itemNome, value: VALOR_REAIS, imageBase64: await logo() },
    // Primeira cobrança hoje: quem está nesta tela já passou do teste.
    subscription: { cycle: PLANO.ciclo, nextDueDate: dataAsaas(new Date()) },
  });

  await db
    .update(subscriptions)
    .set({ checkoutId: checkout.id, updatedAt: new Date() })
    .where(eq(subscriptions.id, sub.id));

  return checkout.link;
}

/** Grava a assinatura que o checkout criou e traz o estado das cobranças. */
async function adotarAssinatura(
  sub: Subscription,
  remota: asaas.AsaasSubscription,
): Promise<Subscription> {
  const payments = await asaas.listSubscriptionPayments(remota.id).catch(() => []);
  const state = stateFromPayments(payments);

  const [row] = await db
    .update(subscriptions)
    .set({
      asaasSubscriptionId: remota.id,
      asaasCustomerId: remota.customer,
      checkoutId: null,
      status: state.status,
      paidThrough: state.paidThrough,
      nextDueDate: state.nextDueDate ?? remota.nextDueDate,
      invoiceUrl: state.invoiceUrl,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, sub.id))
    .returning();
  return row;
}

const maisNova = (as: asaas.AsaasSubscription[]): asaas.AsaasSubscription | null =>
  [...as]
    .filter((a) => !a.deleted)
    .sort((a, b) => (a.dateCreated ?? '').localeCompare(b.dateCreated ?? ''))
    .pop() ?? null;

/**
 * Descobre a assinatura criada pelo checkout e liga à conta. Dois caminhos:
 *
 *  - `customerId` vem do webhook `CHECKOUT_PAID` e é o caminho garantido;
 *  - sem ele, tentamos pelo `externalReference` (o id do usuário), que serve à
 *    volta do redirect, quando ainda não há webhook — em dev não há nenhum.
 *
 * Devolve a linha atualizada, ou a mesma se nada foi encontrado ainda.
 */
export async function reconcileCheckout(
  user: User,
  sub: Subscription,
  customerId?: string | null,
): Promise<Subscription> {
  if (temAssinaturaAtiva(sub)) return sub;

  const candidatas = customerId
    ? await asaas.listSubscriptions({ customer: customerId })
    : await asaas.listSubscriptions({ externalReference: user.id });

  const remota = maisNova(candidatas);
  return remota ? adotarAssinatura(sub, remota) : sub;
}

/** Idem, a partir do id de checkout que o webhook entrega. */
export async function reconcileByCheckoutId(
  checkoutId: string,
  customerId?: string | null,
): Promise<Subscription | null> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.checkoutId, checkoutId))
    .limit(1);
  if (!sub) return null;

  const candidatas = customerId
    ? await asaas.listSubscriptions({ customer: customerId })
    : await asaas.listSubscriptions({ externalReference: sub.ownerId });

  const remota = maisNova(candidatas);
  return remota ? adotarAssinatura(sub, remota) : sub;
}

/** `db` ou uma transação — o webhook grava o estado junto do id do evento. */
export type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export function writeSubscriptionState(
  exec: Executor,
  id: string,
  state: SubscriptionState,
): Promise<unknown> {
  return exec
    .update(subscriptions)
    .set({
      status: state.status,
      paidThrough: state.paidThrough,
      nextDueDate: state.nextDueDate,
      invoiceUrl: state.invoiceUrl,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, id));
}

/**
 * O que o Asaas relata agora sobre esta assinatura. Null quando ela ainda não
 * existe, ou quando ele não devolveu cobrança nenhuma: resposta vazia não é
 * "não deve nada", e regravar apagaria o que a agência precisa pagar.
 */
export async function fetchSubscriptionState(
  sub: Subscription,
): Promise<SubscriptionState | null> {
  if (!sub.asaasSubscriptionId) return null;
  const payments = await asaas.listSubscriptionPayments(sub.asaasSubscriptionId);
  return payments.length ? stateFromPayments(payments) : null;
}

/**
 * Relê as cobranças no Asaas e regrava o estado local. É o que faz a tela de
 * cobrança funcionar sem depender de webhook: em dev não existe URL pública, e
 * em produção um evento pode se perder (o Asaas descarta o que não entregou em
 * 14 dias).
 */
export async function syncSubscription(sub: Subscription): Promise<Subscription> {
  const state = await fetchSubscriptionState(sub);
  if (!state) return sub;
  await writeSubscriptionState(db, sub.id, state);
  return (await getSubscription(sub.ownerId)) ?? sub;
}

/**
 * Cancela a assinatura no Asaas. O `paidThrough` fica de pé de propósito: o mês
 * já pago continua valendo e o app trava quando ele vencer, em vez de cortar o
 * acesso na hora de quem pagou.
 */
export async function cancelSubscription(sub: Subscription): Promise<Subscription> {
  if (sub.asaasSubscriptionId) await asaas.deleteSubscription(sub.asaasSubscriptionId);

  const [row] = await db
    .update(subscriptions)
    .set({
      status: 'CANCELADA',
      // O Asaas apaga as cobranças em aberto junto: não há mais o que pagar.
      asaasSubscriptionId: null,
      checkoutId: null,
      nextDueDate: null,
      invoiceUrl: null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, sub.id))
    .returning();
  return row;
}

/**
 * Acha a assinatura que um evento de webhook diz respeito. O id da assinatura é
 * o caminho normal; cliente e `externalReference` são a rede de segurança para
 * eventos de cobrança avulsa ou payload incompleto.
 */
export async function findSubscriptionForEvent(hint: {
  subscriptionId?: string | null;
  customerId?: string | null;
  ownerId?: string | null;
}): Promise<Subscription | null> {
  // `externalReference` é texto livre no Asaas: comparar qualquer coisa com uma
  // coluna uuid derruba a query, então só entra o que tem cara de uuid.
  const ownerId = UUID.test(hint.ownerId ?? '') ? hint.ownerId! : null;

  const buscas: SQL[] = [];
  if (hint.subscriptionId) {
    buscas.push(eq(subscriptions.asaasSubscriptionId, hint.subscriptionId));
  }
  if (hint.customerId) buscas.push(eq(subscriptions.asaasCustomerId, hint.customerId));
  if (ownerId) buscas.push(eq(subscriptions.ownerId, ownerId));

  for (const where of buscas) {
    const [row] = await db.select().from(subscriptions).where(where).limit(1);
    if (row) return row;
  }
  return null;
}
