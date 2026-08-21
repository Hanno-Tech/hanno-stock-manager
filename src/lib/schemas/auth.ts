import { z } from 'zod';
import { isValidCpfCnpj, normalizeDoc } from '@/lib/billing/cpf-cnpj';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Informe seu nome'),
  email: z.string().email('E-mail inválido'),
  // O Asaas não cria cliente sem documento, então o cadastro pede. Guardamos
  // normalizado (só dígitos e letras) — a máscara é assunto de tela.
  cpfCnpj: z.string().transform(normalizeDoc).refine(isValidCpfCnpj, 'CPF ou CNPJ inválido'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
