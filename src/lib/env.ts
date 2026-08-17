import { z } from 'zod';

/**
 * Validação centralizada das variáveis de ambiente.
 * Falha rápido no boot se algo obrigatório estiver ausente.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.string().url().optional(),
  // Injetado pela Vercel (store `doca-fotos`). Opcional: sem ele o app sobe e só
  // o upload de foto falha, com mensagem na tela.
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:', z.treeifyError(parsed.error));
  throw new Error('Configuração de ambiente inválida. Verifique o arquivo .env');
}

export const env = parsed.data;
