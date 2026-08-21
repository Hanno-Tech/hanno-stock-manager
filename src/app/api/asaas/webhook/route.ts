import { createHash, timingSafeEqual } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { asaasEvents, subscriptions } from '@/db/schema';
import { env } from '@/lib/env';
import {
  fetchSubscriptionState,
  findSubscriptionForEvent,
  reconcileByCheckoutId,
  writeSubscriptionState,
} from '@/features/billing/subscription';

/**
 * Webhook do Asaas — é por aqui que o Doca descobre que a mensalidade foi paga.
 *
 * Três cuidados que o desenho desta rota resolve:
 *
 *  1. **Autenticação.** O Asaas manda o token configurado no webhook no header
 *     `asaas-access-token`. Sem `ASAAS_WEBHOOK_TOKEN` no ambiente a rota recusa
 *     tudo com 401 — melhor recusar do que aceitar POST de qualquer um
 *     liberando acesso, e o 401 não revela se a integração existe.
 *  2. **Idempotência.** A entrega é "at least once": o mesmo evento chega mais
 *     de uma vez. O id do evento é chave primária de `asaas_event`.
 *  3. **Retentativa.** O id do evento e a mudança de estado são gravados na
 *     mesma transação, e a leitura no Asaas vem antes dela. Se algo falhar, o
 *     evento não fica marcado como processado e a retentativa do Asaas resolve
 *     — ao contrário de "gravou o id, respondeu 200 e depois quebrou".
 *  4. **A fila não pode pausar à toa.** O Asaas só aceita **200** como sucesso;
 *     qualquer outro código é retentativa, e 15 seguidas interrompem a fila.
 *     Por isso só devolvemos erro no que a retentativa pode resolver: token
 *     inválido (401) e falha nossa ao processar (500 pela exceção). Payload
 *     estranho responde 200 e vira log.
 *
 * Em vez de interpretar cada evento, qualquer evento relevante dispara uma
 * releitura das cobranças da assinatura. Um evento perdido ou fora de ordem não
 * deixa o estado torto: a fonte de verdade é sempre o Asaas.
 */

const eventoSchema = z.object({
  id: z.string().min(1),
  event: z.string().min(1),
  payment: z
    .object({
      id: z.string(),
      subscription: z.string().nullish(),
      customer: z.string().nullish(),
      externalReference: z.string().nullish(),
    })
    .nullish(),
  subscription: z
    .object({
      id: z.string(),
      customer: z.string().nullish(),
      externalReference: z.string().nullish(),
    })
    .nullish(),
  checkout: z
    .object({
      id: z.string(),
      customer: z.string().nullish(),
      externalReference: z.string().nullish(),
    })
    .nullish(),
});

/** Comparação em tempo constante — o token é credencial, não identificador. */
function tokenValido(enviado: string | null, esperado: string): boolean {
  if (!enviado) return false;
  const a = createHash('sha256').update(enviado).digest();
  const b = createHash('sha256').update(esperado).digest();
  return timingSafeEqual(a, b);
}

const recebido = (ok: boolean, status = 200) =>
  Response.json({ received: ok }, { status });

export async function POST(req: Request) {
  // Falta de token e token errado devolvem a mesma coisa: quem sondar o
  // endpoint não descobre se a integração está configurada. O motivo real fica
  // no log do servidor.
  if (!env.ASAAS_WEBHOOK_TOKEN) {
    console.error('[asaas] webhook chamado sem ASAAS_WEBHOOK_TOKEN configurado');
    return recebido(false, 401);
  }
  if (!tokenValido(req.headers.get('asaas-access-token'), env.ASAAS_WEBHOOK_TOKEN)) {
    return recebido(false, 401);
  }

  const parsed = eventoSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    // 200 de propósito. O Asaas só considera sucesso o 200: qualquer outro
    // código vira retentativa, e 15 seguidas pausam a fila inteira. Payload que
    // não entendemos não melhora se for reenviado — pausar a fila por causa
    // dele derrubaria também os eventos que importam.
    console.error('[asaas] webhook com payload inesperado:', JSON.stringify(parsed.error.issues));
    return recebido(true);
  }
  const evento = parsed.data;

  const [visto] = await db
    .select({ id: asaasEvents.id })
    .from(asaasEvents)
    .where(eq(asaasEvents.id, evento.id))
    .limit(1);
  if (visto) return recebido(true);

  // Checkout pago: é aqui que a assinatura criada pela página do Asaas ganha
  // dono. O id do checkout é a chave — o Asaas não deixa consultá-lo depois.
  if (evento.event === 'CHECKOUT_PAID' && evento.checkout) {
    const ligada = await reconcileByCheckoutId(evento.checkout.id, evento.checkout.customer);
    await db
      .insert(asaasEvents)
      .values({ id: evento.id, event: evento.event })
      .onConflictDoNothing();
    if (ligada) {
      revalidatePath('/assinatura');
      revalidatePath('/app/perfil');
    }
    return recebido(true);
  }

  const sub = await findSubscriptionForEvent({
    subscriptionId: evento.payment?.subscription ?? evento.subscription?.id,
    customerId: evento.payment?.customer ?? evento.subscription?.customer ?? evento.checkout?.customer,
    ownerId:
      evento.payment?.externalReference ??
      evento.subscription?.externalReference ??
      evento.checkout?.externalReference,
  });

  // Evento de uma cobrança que não é de assinatura do Doca (ou de uma conta já
  // apagada): registra para não voltar e devolve 200.
  if (!sub) {
    await db.insert(asaasEvents).values({ id: evento.id, event: evento.event }).onConflictDoNothing();
    return recebido(true);
  }

  // Leitura antes da transação: se o Asaas falhar aqui, nada foi marcado como
  // processado e a retentativa dele reprocessa o evento.
  const state =
    evento.event === 'SUBSCRIPTION_DELETED' ? null : await fetchSubscriptionState(sub);

  await db.transaction(async (tx) => {
    const [novo] = await tx
      .insert(asaasEvents)
      .values({ id: evento.id, event: evento.event })
      .onConflictDoNothing()
      .returning();
    // Outro POST do mesmo evento chegou primeiro e já aplicou.
    if (!novo) return;

    if (evento.event === 'SUBSCRIPTION_DELETED') {
      // `paidThrough` fica de pé: quem pagou o mês usa até o fim dele.
      await tx
        .update(subscriptions)
        .set({ status: 'CANCELADA', invoiceUrl: null, updatedAt: new Date() })
        .where(eq(subscriptions.id, sub.id));
    } else if (state) {
      await writeSubscriptionState(tx, sub.id, state);
    }
  });

  revalidatePath('/assinatura');
  revalidatePath('/app/perfil');
  return recebido(true);
}
