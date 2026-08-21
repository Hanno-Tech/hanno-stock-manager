/**
 * O plano do Doca — os mesmos R$ 19,90/mês anunciados em /sobre.
 *
 * A assinatura no Asaas **não** é criada no cadastro: nos primeiros
 * `trialDias` a agência usa de graça e não existe cobrança nenhuma. Quando o
 * teste acaba, o app manda a agência para o checkout hospedado do Asaas, que
 * coleta o cartão e abre a assinatura recorrente — o número do cartão nunca
 * passa pelo Doca.
 *
 * Consequência de propósito: uma agência que testou e não voltou nunca recebe
 * cobrança. Ela só começa quando alguém decide assinar.
 */
export const PLANO = {
  valorCentavos: 1990,
  descricao: 'Doca — plano mensal por agência',
  ciclo: 'MONTHLY',
  trialDias: 7,
  /** Só cartão: é a única forma que o Asaas renova sozinho todo mês. */
  billingType: 'CREDIT_CARD',
  /** Vida do link de checkout (o Asaas aceita de 10 a 1440 minutos). */
  checkoutExpiraMin: 60,
  /** Nome do item na página de pagamento (o Asaas corta em 30 caracteres). */
  itemNome: 'Doca — plano mensal',
  /** Quanto uma fatura paga estica o acesso: o ciclo mensal… */
  cicloDias: 30,
  /** …mais uma folga, para o pagamento do mês seguinte não precisar cair
   *  exatamente no dia do vencimento para o app não travar. */
  folgaDias: 5,
} as const;

/** Valor em reais, que é como o Asaas recebe (19.9, não 1990). */
export const VALOR_REAIS = PLANO.valorCentavos / 100;

export const VALOR_FORMATADO = (PLANO.valorCentavos / 100).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function addDias(base: Date, dias: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return d;
}

// `toISOString()` seria UTC: às 22h de Joinville o dia já virou lá, e o
// vencimento sairia um dia à frente do combinado.
const dataFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Data no formato que o Asaas espera (YYYY-MM-DD), no fuso de Brasília. */
export const dataAsaas = (d: Date): string => dataFmt.format(d);

/** Lê um `dueDate` do Asaas ("2026-10-05") como meio-dia de Brasília, para o
 *  cálculo de prazo não escorregar de dia por causa de fuso. */
export const dataDeAsaas = (s: string): Date => new Date(`${s}T12:00:00-03:00`);

/** Dias inteiros que faltam até `data` (0 se já passou). */
export function diasAte(data: Date, agora = new Date()): number {
  const ms = data.getTime() - agora.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
}
