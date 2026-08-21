import 'server-only';
import { env } from '@/lib/env';
import type { AsaasPayment } from './state';

/**
 * Cliente HTTP do Asaas (API v3) — só os quatro movimentos que a cobrança do
 * Doca faz: achar/criar o cliente, abrir a assinatura e ler as faturas dela.
 *
 * O ambiente sai do prefixo da chave (`$aact_prod_` = produção,
 * `$aact_hmlg_` = sandbox), então é impossível apontar a chave de produção
 * para o sandbox por descuido de config. `ASAAS_ENV` existe só para chaves
 * antigas, emitidas antes de o Asaas padronizar esse prefixo.
 */
const ENDPOINT = {
  production: 'https://api.asaas.com/v3',
  sandbox: 'https://api-sandbox.asaas.com/v3',
} as const;

/** O Asaas exige User-Agent identificando a aplicação em contas novas. */
const USER_AGENT = 'DocaApp';

/** O cadastro espera por esta chamada; não pode ficar pendurado. */
const TIMEOUT_MS = 10_000;

/**
 * Erro de cobrança já pronto para a tela. A `message` é sempre genérica: o
 * detalhe (chave ausente, ambiente errado, resposta do Asaas) vai para o log do
 * servidor e nunca para o cliente — falha de configuração não é assunto da
 * agência, e dizer o que falta é dar mapa para quem estiver sondando.
 */
export class AsaasError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'AsaasError';
  }
}

/** O que a agência lê quando a cobrança não anda. */
const GENERICA = 'Não foi possível processar o pagamento agora. Tente de novo em instantes.';

/** Registra o detalhe no servidor e devolve o erro genérico para a tela. */
export function falhaAsaas(detalhe: string, status?: number, code?: string): AsaasError {
  console.error('[asaas]', detalhe);
  return new AsaasError(GENERICA, status, code);
}

function baseUrl(key: string): string {
  if (env.ASAAS_ENV) return ENDPOINT[env.ASAAS_ENV];
  if (key.startsWith('$aact_prod_')) return ENDPOINT.production;
  if (key.startsWith('$aact_hmlg_')) return ENDPOINT.sandbox;
  throw falhaAsaas(
    'chave sem prefixo reconhecido ($aact_prod_ / $aact_hmlg_); defina ASAAS_ENV',
  );
}

/** True quando há chave configurada — o app sobe e opera sem ela. */
export const asaasConfigurado = (): boolean => !!env.ASAAS_API_KEY;

async function request<T>(
  path: string,
  init: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown } = {},
): Promise<T> {
  const key = env.ASAAS_API_KEY;
  if (!key) throw falhaAsaas('ASAAS_API_KEY ausente — cobrança não configurada');

  let res: Response;
  try {
    res = await fetch(baseUrl(key) + path, {
      method: init.method ?? 'GET',
      headers: {
        access_token: key,
        'User-Agent': USER_AGENT,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch (cause) {
    throw falhaAsaas(`falha de rede em ${path}: ${(cause as Error).message}`);
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Página de erro em HTML (proxy, manutenção): a mensagem crua não ajuda.
    throw falhaAsaas(`${path} respondeu ${res.status} sem JSON`, res.status);
  }

  if (!res.ok) {
    const first = (data as { errors?: { code?: string; description?: string }[] })?.errors?.[0];
    // A descrição do Asaas fica no log: ela diz coisas como "a chave de API
    // fornecida é inválida", que a agência não pode ver nem resolver.
    throw falhaAsaas(
      `${path} → ${res.status} ${first?.code ?? ''} ${first?.description ?? ''}`.trim(),
      res.status,
      first?.code,
    );
  }
  return data as T;
}

// ---------------------------------------------------------------------------
// Tipos — só os campos que o Doca usa das respostas do Asaas.
// ---------------------------------------------------------------------------
export type AsaasSubscription = {
  id: string;
  customer: string;
  status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
  value: number;
  nextDueDate: string;
  dateCreated?: string;
  deleted?: boolean;
  externalReference?: string | null;
};

export type AsaasCheckout = {
  id: string;
  /** URL da página hospedada, para onde a agência é enviada. */
  link: string;
  status: 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PAID';
};

type AsaasList<T> = { data: T[]; hasMore: boolean; totalCount: number };

// O tipo da cobrança mora em `state.ts`, que é puro: as regras de status são
// testadas sem passar por aqui (este módulo é server-only).
export type { AsaasPayment } from './state';

// ---------------------------------------------------------------------------
// Operações
// ---------------------------------------------------------------------------

/**
 * Cria a página de pagamento hospedada. É ela que coleta cartão e endereço e
 * abre a assinatura recorrente — o número do cartão nunca chega ao Doca.
 *
 * Duas restrições do Asaas que moldam a chamada: as URLs de callback precisam
 * ser públicas (localhost é recusado) e `items[].imageBase64` é obrigatório.
 */
export function createCheckout(input: {
  externalReference: string;
  callback: { successUrl: string; cancelUrl: string; expiredUrl: string };
  item: { name: string; value: number; imageBase64: string };
  subscription: { cycle: string; nextDueDate: string };
  minutesToExpire: number;
}): Promise<AsaasCheckout> {
  const { item, ...resto } = input;
  return request<AsaasCheckout>('/checkouts', {
    method: 'POST',
    body: {
      billingTypes: ['CREDIT_CARD'],
      chargeTypes: ['RECURRENT'],
      items: [{ ...item, quantity: 1 }],
      ...resto,
    },
  });
}

/** Assinaturas de um cliente, ou as que carregam nosso `externalReference`. */
export async function listSubscriptions(filtro: {
  customer?: string;
  externalReference?: string;
}): Promise<AsaasSubscription[]> {
  const q = new URLSearchParams({ limit: '100' });
  if (filtro.customer) q.set('customer', filtro.customer);
  if (filtro.externalReference) q.set('externalReference', filtro.externalReference);
  const list = await request<AsaasList<AsaasSubscription>>(`/subscriptions?${q}`);
  return list.data;
}

/**
 * Cancela a assinatura. O Asaas apaga as cobranças pendentes e vencidas dela e
 * mantém as já pagas — então o acesso que a agência pagou continua valendo.
 */
export function deleteSubscription(id: string): Promise<{ deleted: boolean; id: string }> {
  return request(`/subscriptions/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** Cobranças de uma assinatura, da mais antiga para a mais nova. */
export async function listSubscriptionPayments(
  subscriptionId: string,
): Promise<AsaasPayment[]> {
  const list = await request<AsaasList<AsaasPayment>>(
    `/subscriptions/${encodeURIComponent(subscriptionId)}/payments?limit=100`,
  );
  return [...list.data].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
