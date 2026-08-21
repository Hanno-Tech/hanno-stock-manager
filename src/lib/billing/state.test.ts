import { describe, it, expect } from 'vitest';
import {
  billingFor,
  paidThroughFor,
  stateFromPayments,
  type AsaasPayment,
} from './state';
import { PLANO } from './plan';

const cobranca = (over: Partial<AsaasPayment> & { status: string; dueDate: string }): AsaasPayment => ({
  id: 'pay_1',
  customer: 'cus_1',
  subscription: 'sub_1',
  value: 19.9,
  invoiceUrl: 'https://asaas.com/i/pay_1',
  ...over,
});

const AGORA = new Date('2026-09-10T12:00:00-03:00');

describe('paidThroughFor', () => {
  it('conta do vencimento, não do pagamento: um ciclo mais a folga', () => {
    const d = paidThroughFor('2026-09-01');
    const esperado = new Date('2026-09-01T12:00:00-03:00');
    esperado.setDate(esperado.getDate() + PLANO.cicloDias + PLANO.folgaDias);
    expect(d.toISOString()).toBe(esperado.toISOString());
  });
});

describe('stateFromPayments', () => {
  it('sem cobrança nenhuma fica pendente', () => {
    expect(stateFromPayments([], AGORA)).toEqual({
      status: 'PENDENTE',
      paidThrough: null,
      nextDueDate: null,
      invoiceUrl: null,
    });
  });

  it('fatura em aberto vira PENDENTE e entrega o link de pagamento', () => {
    const s = stateFromPayments(
      [cobranca({ status: 'PENDING', dueDate: '2026-10-25', invoiceUrl: 'https://asaas.com/i/x' })],
      AGORA,
    );
    expect(s.status).toBe('PENDENTE');
    expect(s.paidThrough).toBeNull();
    expect(s.nextDueDate).toBe('2026-10-25');
    expect(s.invoiceUrl).toBe('https://asaas.com/i/x');
  });

  it('fatura paga vira ATIVA com acesso até um ciclo depois do vencimento', () => {
    const s = stateFromPayments([cobranca({ status: 'RECEIVED', dueDate: '2026-09-01' })], AGORA);
    expect(s.status).toBe('ATIVA');
    expect(s.paidThrough).toEqual(paidThroughFor('2026-09-01'));
  });

  // Cartão confirmado ainda não caiu na conta, mas o acesso não espera o repasse.
  it('trata CONFIRMED como pago', () => {
    expect(
      stateFromPayments([cobranca({ status: 'CONFIRMED', dueDate: '2026-09-01' })], AGORA).status,
    ).toBe('ATIVA');
  });

  it('fatura vencida trava e continua apontando o link', () => {
    const s = stateFromPayments([cobranca({ status: 'OVERDUE', dueDate: '2026-08-20' })], AGORA);
    expect(s.status).toBe('VENCIDA');
    expect(s.paidThrough).toBeNull();
    expect(s.nextDueDate).toBe('2026-08-20');
  });

  it('mês pago + próxima fatura em aberto: segue ATIVA, mas já mostra a nova', () => {
    const s = stateFromPayments(
      [
        cobranca({ id: 'pay_1', status: 'RECEIVED', dueDate: '2026-09-01' }),
        cobranca({ id: 'pay_2', status: 'PENDING', dueDate: '2026-10-01', invoiceUrl: 'https://asaas.com/i/2' }),
      ],
      AGORA,
    );
    expect(s.status).toBe('ATIVA');
    expect(s.nextDueDate).toBe('2026-10-01');
    expect(s.invoiceUrl).toBe('https://asaas.com/i/2');
  });

  it('escolhe a fatura em aberto de vencimento mais próximo', () => {
    const s = stateFromPayments(
      [
        cobranca({ id: 'pay_2', status: 'PENDING', dueDate: '2026-11-01', invoiceUrl: 'https://asaas.com/i/2' }),
        cobranca({ id: 'pay_1', status: 'OVERDUE', dueDate: '2026-08-01', invoiceUrl: 'https://asaas.com/i/1' }),
      ],
      AGORA,
    );
    expect(s.nextDueDate).toBe('2026-08-01');
    expect(s.invoiceUrl).toBe('https://asaas.com/i/1');
  });

  it('acesso vence sozinho quando o pagamento fica velho, sem webhook novo', () => {
    const s = stateFromPayments([cobranca({ status: 'RECEIVED', dueDate: '2026-06-01' })], AGORA);
    expect(s.status).toBe('CANCELADA');
    expect(s.paidThrough!.getTime()).toBeLessThan(AGORA.getTime());
  });

  it('cobrança estornada não sustenta acesso', () => {
    const s = stateFromPayments([cobranca({ status: 'REFUNDED', dueDate: '2026-09-01' })], AGORA);
    expect(s.status).toBe('CANCELADA');
    expect(s.paidThrough).toBeNull();
  });
});

describe('billingFor', () => {
  const emDia = { paidThrough: new Date('2026-10-06T12:00:00-03:00') };
  const atrasada = { paidThrough: new Date('2026-08-01T12:00:00-03:00') };

  it('conta anterior à cobrança entra sempre', () => {
    expect(billingFor({ trialEndsAt: null }, null, AGORA)).toEqual({
      allowed: true,
      kind: 'LEGADO',
      diasRestantes: 0,
    });
  });

  it('dentro do teste, entra e diz quantos dias faltam', () => {
    const v = billingFor({ trialEndsAt: new Date('2026-09-13T12:00:00-03:00') }, null, AGORA);
    expect(v).toEqual({ allowed: true, kind: 'TRIAL', diasRestantes: 3 });
  });

  it('teste acabado sem pagamento trava', () => {
    const v = billingFor({ trialEndsAt: new Date('2026-09-05T12:00:00-03:00') }, null, AGORA);
    expect(v).toEqual({ allowed: false, kind: 'TRIAL_EXPIRADO', diasRestantes: 0 });
  });

  it('assinatura paga vale mais que o fim do teste', () => {
    const v = billingFor({ trialEndsAt: new Date('2026-09-05T12:00:00-03:00') }, emDia, AGORA);
    expect(v.allowed).toBe(true);
    expect(v.kind).toBe('ATIVA');
  });

  it('quem já pagou e atrasou vê mensalidade vencida, não fim de teste', () => {
    const v = billingFor({ trialEndsAt: new Date('2026-09-05T12:00:00-03:00') }, atrasada, AGORA);
    expect(v).toEqual({ allowed: false, kind: 'VENCIDA', diasRestantes: 0 });
  });
});
