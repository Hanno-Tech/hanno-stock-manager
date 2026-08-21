/**
 * As duas regras de decisão da cobrança, isoladas de banco e de HTTP para
 * poderem ser testadas direto:
 *
 *  - `stateFromPayments` — o que as cobranças do Asaas dizem sobre a assinatura.
 *  - `billingFor` — se esta conta entra no app agora.
 */
import { PLANO, addDias, dataDeAsaas, diasAte } from './plan';

/** Status de cobrança do Asaas. String aberta: a lista deles cresce. */
export type AsaasPaymentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'RECEIVED'
  | 'RECEIVED_IN_CASH'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'CHARGEBACK_REQUESTED'
  | (string & {});

/** Só os campos de uma cobrança do Asaas que o Doca usa. */
export type AsaasPayment = {
  id: string;
  customer: string;
  subscription?: string | null;
  externalReference?: string | null;
  status: AsaasPaymentStatus;
  value: number;
  dueDate: string;
  invoiceUrl: string;
};

/** Cobranças em que o dinheiro já entrou (ou está garantido). */
export const PAGAS: ReadonlySet<string> = new Set(['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH']);

/** Cobranças que ainda esperam pagamento — é uma delas que vai para o botão. */
export const EM_ABERTO: ReadonlySet<string> = new Set([
  'PENDING',
  'OVERDUE',
  'AWAITING_RISK_ANALYSIS',
]);

export type SubscriptionStatus = 'PENDENTE' | 'ATIVA' | 'VENCIDA' | 'CANCELADA';

export type SubscriptionState = {
  status: SubscriptionStatus;
  paidThrough: Date | null;
  nextDueDate: string | null;
  invoiceUrl: string | null;
};

/**
 * Até quando uma fatura paga garante o acesso: o vencimento dela mais um ciclo
 * e a folga. Conta a partir do **vencimento**, não da data do pagamento — quem
 * paga adiantado não perde os dias que adiantou, e quem paga atrasado não ganha
 * um mês extra por ter demorado.
 */
export function paidThroughFor(dueDate: string): Date {
  return addDias(dataDeAsaas(dueDate), PLANO.cicloDias + PLANO.folgaDias);
}

/**
 * Resume a lista de cobranças de uma assinatura no estado que o Doca guarda.
 * A fatura em aberto escolhida é a de vencimento mais próximo — é a que a
 * agência tem de pagar para destravar.
 */
export function stateFromPayments(
  payments: readonly AsaasPayment[],
  agora = new Date(),
): SubscriptionState {
  const pagas = payments.filter((p) => PAGAS.has(p.status));
  const paidThrough = pagas.length
    ? pagas
        .map((p) => paidThroughFor(p.dueDate))
        .reduce((maior, d) => (d > maior ? d : maior))
    : null;

  const abertas = payments
    .filter((p) => EM_ABERTO.has(p.status))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const aberta = abertas[0] ?? null;

  const emDia = !!paidThrough && paidThrough > agora;
  const status: SubscriptionStatus = emDia
    ? 'ATIVA'
    : aberta?.status === 'OVERDUE'
      ? 'VENCIDA'
      : aberta
        ? 'PENDENTE'
        : // Nenhuma cobrança paga e nenhuma em aberto: estornada, apagada ou
          // assinatura encerrada no Asaas.
          payments.length
          ? 'CANCELADA'
          : 'PENDENTE';

  return {
    status,
    paidThrough,
    nextDueDate: aberta?.dueDate ?? null,
    invoiceUrl: aberta?.invoiceUrl ?? null,
  };
}

// ---------------------------------------------------------------------------
// Portão de acesso
// ---------------------------------------------------------------------------
export type BillingKind = 'LEGADO' | 'TRIAL' | 'ATIVA' | 'TRIAL_EXPIRADO' | 'VENCIDA';

export type BillingVerdict = {
  allowed: boolean;
  kind: BillingKind;
  /** Dias inteiros que faltam para o teste acabar (0 quando já acabou). */
  diasRestantes: number;
};

/**
 * Decide se a conta usa o app agora. A ordem importa:
 *
 *  1. Conta sem `trialEndsAt` é de antes da cobrança existir — entra sempre.
 *  2. Assinatura paga (`paidThrough` no futuro) vale mais que o teste.
 *  3. Dentro do teste, entra.
 *  4. Fora disso, trava — e o motivo muda a tela: quem nunca pagou vê "o teste
 *     acabou", quem já pagou vê "a mensalidade venceu".
 */
export function billingFor(
  user: { trialEndsAt: Date | null },
  sub: { paidThrough: Date | null } | null,
  agora = new Date(),
): BillingVerdict {
  if (!user.trialEndsAt) return { allowed: true, kind: 'LEGADO', diasRestantes: 0 };

  const diasRestantes = diasAte(user.trialEndsAt, agora);

  if (sub?.paidThrough && sub.paidThrough > agora) {
    return { allowed: true, kind: 'ATIVA', diasRestantes };
  }
  if (agora < user.trialEndsAt) {
    return { allowed: true, kind: 'TRIAL', diasRestantes };
  }
  return {
    allowed: false,
    kind: sub?.paidThrough ? 'VENCIDA' : 'TRIAL_EXPIRADO',
    diasRestantes: 0,
  };
}
