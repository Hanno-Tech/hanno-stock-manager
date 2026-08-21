#!/usr/bin/env node
/**
 * Ferramenta de desenvolvimento para exercitar a cobrança sem sair do terminal.
 *
 *   node scripts/asaas-sandbox.mjs fatura   <email>   # mostra a cobrança em aberto
 *   node scripts/asaas-sandbox.mjs pagar    <email>   # dá baixa nela no sandbox
 *   node scripts/asaas-sandbox.mjs webhook  <email> [EVENTO]  # dispara o webhook local
 *   node scripts/asaas-sandbox.mjs travar   <email>   # joga o fim do teste para ontem
 *
 * Só funciona com chave de **sandbox**: dar baixa numa cobrança de produção
 * seria liberar acesso sem dinheiro ter entrado.
 */
import { readFileSync } from 'node:fs';
import postgres from 'postgres';

const BASE = 'https://api-sandbox.asaas.com/v3';
const WEBHOOK_URL = process.env.WEBHOOK_URL ?? 'http://localhost:3000/api/asaas/webhook';

function env() {
  const out = {};
  for (const arquivo of ['.env', '.env.local']) {
    let texto;
    try {
      texto = readFileSync(arquivo, 'utf8');
    } catch {
      continue;
    }
    for (const linha of texto.split('\n')) {
      const m = linha.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      // Desfaz o escape de `$` que o Next exige nos arquivos .env.
      out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '').replace(/\\\$/g, '$');
    }
  }
  return out;
}

const E = env();
const KEY = E.ASAAS_API_KEY;

if (!KEY) fatal('ASAAS_API_KEY ausente no .env');
if (!KEY.startsWith('$aact_hmlg_')) {
  fatal('Esta chave não é de sandbox ($aact_hmlg_). Abortando para não mexer em cobrança real.');
}

function fatal(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

async function asaas(path, init = {}) {
  const res = await fetch(BASE + path, {
    method: init.method ?? 'GET',
    headers: {
      access_token: KEY,
      'User-Agent': 'DocaApp',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const texto = await res.text();
  const dados = texto ? JSON.parse(texto) : null;
  if (!res.ok) fatal(`Asaas ${res.status}: ${dados?.errors?.[0]?.description ?? texto}`);
  return dados;
}

const sql = postgres(E.DATABASE_URL, { max: 1 });

async function contaDe(email) {
  const [row] = await sql`
    select u.id as user_id, u.email, u.trial_ends_at,
           s.asaas_customer_id, s.asaas_subscription_id, s.checkout_id,
           s.status, s.paid_through
      from "user" u
      left join subscription s on s.owner_id = u.id
     where u.email = ${email}
     limit 1`;
  if (!row) fatal(`Nenhuma conta com o e-mail ${email}`);
  return row;
}

/** Cobrança que ainda espera dinheiro — é a que o app manda pagar. */
async function faturaAberta(subscriptionId) {
  if (!subscriptionId) return null;
  const { data } = await asaas(`/subscriptions/${subscriptionId}/payments?limit=100`);
  const abertas = data
    .filter((p) => ['PENDING', 'OVERDUE', 'AWAITING_RISK_ANALYSIS'].includes(p.status))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return abertas[0] ?? null;
}

const [comando, email, extra] = process.argv.slice(2);
if (!comando || !email) fatal('Uso: node scripts/asaas-sandbox.mjs <comando> <email> [extra]');

const conta = await contaDe(email);

switch (comando) {
  case 'fatura': {
    const p = await faturaAberta(conta.asaas_subscription_id);
    console.log({
      email: conta.email,
      assinatura: conta.asaas_subscription_id ?? '(nenhuma — nunca assinou ou cancelou)',
      checkoutAberto: conta.checkout_id ?? '(nenhum)',
      status: conta.status,
      acessoPagoAte: conta.paid_through,
      fimDoTeste: conta.trial_ends_at,
    });
    console.log(
      p
        ? { cobranca: p.id, status: p.status, vencimento: p.dueDate, valor: p.value, link: p.invoiceUrl }
        : 'Nenhuma cobrança em aberto.',
    );
    break;
  }

  case 'pagar': {
    const p = await faturaAberta(conta.asaas_subscription_id);
    if (!p) fatal('Nenhuma cobrança em aberto para pagar.');
    const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
      new Date(),
    );
    const pago = await asaas(`/payments/${p.id}/receiveInCash`, {
      method: 'POST',
      body: { paymentDate: hoje, value: p.value, notifyCustomer: false },
    });
    console.log(`✓ ${pago.id} → ${pago.status}`);
    console.log('Agora aperte "Já paguei" no app, ou rode o comando `webhook` para simular o Asaas.');
    break;
  }

  case 'webhook': {
    if (!E.ASAAS_WEBHOOK_TOKEN) fatal('ASAAS_WEBHOOK_TOKEN ausente no .env');
    const evento = extra ?? 'PAYMENT_RECEIVED';
    const p = await faturaAberta(conta.asaas_subscription_id);
    const payload = {
      // Id único a cada disparo: repetido, a rota responde 200 sem reprocessar.
      id: `evt_local_${Date.now()}`,
      event: evento,
      payment: {
        id: p?.id ?? 'pay_local',
        subscription: conta.asaas_subscription_id,
        customer: conta.asaas_customer_id,
        externalReference: conta.user_id,
      },
    };
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'asaas-access-token': E.ASAAS_WEBHOOK_TOKEN,
      },
      body: JSON.stringify(payload),
    });
    console.log(`${evento} → HTTP ${res.status} ${await res.text()}`);
    break;
  }

  case 'travar': {
    await sql`update "user" set trial_ends_at = now() - interval '1 hour' where id = ${conta.user_id}`;
    console.log('✓ Teste marcado como vencido. Recarregue o app para cair na tela de cobrança.');
    break;
  }

  default:
    fatal(`Comando desconhecido: ${comando}`);
}

await sql.end();
