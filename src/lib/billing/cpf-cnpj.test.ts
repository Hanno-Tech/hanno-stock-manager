import { describe, it, expect } from 'vitest';
import { normalizeDoc, isValidCpf, isValidCnpj, isValidCpfCnpj, formatCpfCnpj } from './cpf-cnpj';

describe('normalizeDoc', () => {
  it('tira máscara e sobe a caixa', () => {
    expect(normalizeDoc('529.982.247-25')).toBe('52998224725');
    expect(normalizeDoc('12.abc.345/01de-35')).toBe('12ABC34501DE35');
  });
});

describe('isValidCpf', () => {
  it('aceita CPF válido', () => {
    expect(isValidCpf('52998224725')).toBe(true);
  });

  it('reprova dígito verificador errado, tamanho errado e repetição', () => {
    expect(isValidCpf('52998224724')).toBe(false);
    expect(isValidCpf('5299822472')).toBe(false);
    expect(isValidCpf('11111111111')).toBe(false);
  });
});

describe('isValidCnpj', () => {
  it('aceita CNPJ numérico', () => {
    expect(isValidCnpj('11222333000181')).toBe(true);
  });

  // Exemplo oficial da Receita para o formato que passou a valer em 31/07/2026.
  it('aceita CNPJ alfanumérico', () => {
    expect(isValidCnpj('12ABC34501DE35')).toBe(true);
  });

  it('reprova dígito errado, letra no verificador e repetição', () => {
    expect(isValidCnpj('11222333000182')).toBe(false);
    expect(isValidCnpj('12ABC34501DE3E')).toBe(false);
    expect(isValidCnpj('00000000000000')).toBe(false);
  });
});

describe('isValidCpfCnpj', () => {
  it('só aceita 11 ou 14 caracteres', () => {
    expect(isValidCpfCnpj('52998224725')).toBe(true);
    expect(isValidCpfCnpj('12ABC34501DE35')).toBe(true);
    expect(isValidCpfCnpj('529982247')).toBe(false);
  });
});

describe('formatCpfCnpj', () => {
  it('aplica a máscara de cada tamanho', () => {
    expect(formatCpfCnpj('52998224725')).toBe('529.982.247-25');
    expect(formatCpfCnpj('12ABC34501DE35')).toBe('12.ABC.345/01DE-35');
  });
});
