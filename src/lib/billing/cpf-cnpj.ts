/**
 * CPF/CNPJ — o Asaas exige documento para criar o cliente da assinatura, então
 * ele passou a ser campo obrigatório do cadastro.
 *
 * O CNPJ aceita letras desde 31/07/2026: as 12 primeiras posições podem ser
 * alfanuméricas e só os dois dígitos verificadores continuam numéricos. O
 * módulo 11 é o mesmo de sempre; o que mudou é o valor de cada caractere, que
 * agora é `ASCII − 48` ("0"→0, "9"→9, "A"→17, "Z"→42). Validar só dígitos
 * reprovaria toda empresa aberta de agora em diante.
 */

/** Tira a máscara e uniformiza: só dígitos e letras maiúsculas. */
export function normalizeDoc(value: string): string {
  return value.toUpperCase().replace(/[^0-9A-Z]/g, '');
}

const valorDe = (c: string) => c.charCodeAt(0) - 48;

function digitoModulo11(doc: string, pesos: readonly number[]): number {
  const soma = pesos.reduce((acc, peso, i) => acc + valorDe(doc[i]) * peso, 0);
  const resto = 11 - (soma % 11);
  return resto >= 10 ? 0 : resto;
}

// O peso do 1º dígito é a mesma lista sem o primeiro item — daí o `.slice(1)`.
const PESOS_CPF = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const PESOS_CNPJ = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

export function isValidCpf(doc: string): boolean {
  if (!/^\d{11}$/.test(doc)) return false;
  // 111.111.111-11 e companhia passam no módulo 11 mas não existem.
  if (/^(\d)\1{10}$/.test(doc)) return false;
  const dv1 = digitoModulo11(doc, PESOS_CPF.slice(1));
  const dv2 = digitoModulo11(doc, PESOS_CPF);
  return doc.slice(9) === `${dv1}${dv2}`;
}

export function isValidCnpj(doc: string): boolean {
  if (!/^[0-9A-Z]{12}\d{2}$/.test(doc)) return false;
  if (/^(.)\1{13}$/.test(doc)) return false;
  const dv1 = digitoModulo11(doc, PESOS_CNPJ.slice(1));
  const dv2 = digitoModulo11(doc, PESOS_CNPJ);
  return doc.slice(12) === `${dv1}${dv2}`;
}

/** Aceita CPF (11) ou CNPJ (14), já normalizado. */
export function isValidCpfCnpj(doc: string): boolean {
  if (doc.length === 11) return isValidCpf(doc);
  if (doc.length === 14) return isValidCnpj(doc);
  return false;
}

/** Máscara para exibição: 000.000.000-00 ou 00.000.000/0000-00. */
export function formatCpfCnpj(doc: string): string {
  const d = normalizeDoc(doc);
  if (d.length === 11) return d.replace(/^(.{3})(.{3})(.{3})(.{2})$/, '$1.$2.$3-$4');
  if (d.length === 14) return d.replace(/^(.{2})(.{3})(.{3})(.{4})(.{2})$/, '$1.$2.$3/$4-$5');
  return d;
}
