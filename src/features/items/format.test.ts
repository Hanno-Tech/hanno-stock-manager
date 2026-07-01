import { describe, it, expect } from 'vitest';
import { SIZE_LABEL, statusPill, formatDateTime } from './format';

describe('format', () => {
  it('mapeia rótulos de tamanho', () => {
    expect(SIZE_LABEL.P).toBe('Pequeno');
    expect(SIZE_LABEL.M).toBe('Médio');
    expect(SIZE_LABEL.G).toBe('Grande');
  });

  it('define pill de status', () => {
    expect(statusPill('ENTREGUE')).toEqual({ label: 'Entregue', tone: 'success' });
    expect(statusPill('AGUARDANDO_RETIRADA')).toEqual({
      label: 'Aguardando Retirada',
      tone: 'warning',
    });
  });

  it('formata data/hora em pt-BR', () => {
    const s = formatDateTime('2026-10-12T14:30:00');
    expect(s).toMatch(/\d{2}/); // contém dia
    expect(s).toContain('14:30');
  });
});
