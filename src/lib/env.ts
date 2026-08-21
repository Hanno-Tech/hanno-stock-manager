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

  // Cobrança (Asaas). Opcional de propósito: sem a chave o app sobe, o cadastro
  // continua criando a conta com o teste grátis e só a assinatura não é aberta
  // — um gateway fora do ar não pode derrubar o balcão.
  ASAAS_API_KEY: z.string().optional(),
  // Só para chaves antigas, sem o prefixo $aact_prod_/$aact_hmlg_ que o cliente
  // usa para descobrir o ambiente sozinho.
  ASAAS_ENV: z.enum(['production', 'sandbox']).optional(),
  // Token que o Asaas devolve no header `asaas-access-token` de cada webhook.
  // Sem ele a rota de webhook recusa tudo, em vez de aceitar qualquer POST.
  ASAAS_WEBHOOK_TOKEN: z.string().optional(),
  // URL pública do app, usada nos callbacks do checkout. O Asaas recusa
  // localhost, então em dev é preciso apontar isto para um túnel.
  APP_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:', z.treeifyError(parsed.error));
  throw new Error('Configuração de ambiente inválida. Verifique o arquivo .env');
}

export const env = parsed.data;
