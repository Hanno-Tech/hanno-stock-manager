# Deploy — MVP custo R$ 0 (Vercel + Neon + Vercel Blob)

Stack gratuita: **Vercel Hobby** (app) · **Neon** (Postgres) · **Vercel Blob** (fotos).
CI por **GitHub Actions** (`.github/workflows/ci.yml`).

> ⚠️ Vercel Hobby é para uso **não-comercial**. Se virar produto pago, migrar para um VPS único com o `docker-compose.yml` (Postgres + Next) ~R$ 25–30/mês — nesse cenário as fotos precisam de outro storage.

## 1. Banco — Neon
Já provisionado: projeto `ep-polished-bar-acosol05` (`sa-east-1`), banco `neondb`.

A connection string está no `DATABASE_URL` da Vercel, marcado como **Sensitive** — ou seja, o valor **não** volta pelo `vercel env pull`. Para rodar migrations é preciso pegá-lo no painel do Neon ou da Vercel.

Para um projeto novo: criar em https://neon.tech, copiar a connection string (com `?sslmode=require`) e aplicar as migrations como na seção 4.

## 2. Fotos — Vercel Blob
Store `doca-fotos` (`store_douH4izdNv5vZMwv`, região `iad1`), criado com acesso **público** — a URL devolvida pelo `put()` vai direto no `<img>` do item.

```bash
npx vercel blob create-store doca-fotos --access public --yes   # já feito
```

O comando vincula o store ao projeto e injeta `BLOB_READ_WRITE_TOKEN` em Production, Preview e Development. Não há chave para gerenciar à mão.

Cota do Hobby: **1 GB** de armazenamento e 10 GB de transfer/mês. As fotos são recomprimidas no cliente (1600px, JPEG 0.8 → 200–400 KB), e trocar a foto de um item apaga a anterior, então 1 GB dá algo como 3 mil fotos.

Localmente as fotos vão para **o mesmo store da produção** — o `BLOB_READ_WRITE_TOKEN` do `.env.local` é o de Development, mas aponta para `doca-fotos`. Se isso incomodar, criar um segundo store só para dev.

## 3. App — Vercel
Projeto `stock-manager` (org `rafael-ramos-projects-ac7c9840`), já importado de `Hanno-Tech/hanno-stock-manager`. Framework detectado: **Next.js**.

Environment Variables (Production):

| Variável | Origem |
|---|---|
| `DATABASE_URL` | connection string do Neon (Sensitive) |
| `AUTH_SECRET` | `openssl rand -base64 32` (Sensitive) |
| `BLOB_READ_WRITE_TOKEN` | injetado pelo `vercel blob create-store` |
| `ASAAS_API_KEY` | chave de produção do Asaas, `$aact_prod_…` (Sensitive) |
| `ASAAS_WEBHOOK_TOKEN` | `openssl rand -hex 24`, o mesmo valor configurado no webhook (Sensitive) |

O HTTPS da Vercel habilita a **câmera do scanner** no celular.

## 4. Migrations em produção
As migrations **não** rodam sozinhas no deploy. A cada mudança de schema:

```bash
npm run db:generate          # gera o SQL a partir do schema
DATABASE_URL="<neon>" npm run db:migrate   # aplica no banco de produção
```

Dois detalhes que já morderam:
- Use o endpoint **direto** do Neon (host **sem** `-pooler`) para DDL; o pooler engasga em `drop schema` / `create type`.
- O `.env` local aponta para o Postgres do Docker, e o `dotenv` do `drizzle.config.ts` **não** sobrescreve variável já exportada — passar `DATABASE_URL` na frente do comando (como acima) funciona.

## 5. Cobrança — Asaas

**Teste grátis primeiro, cobrança depois.** No cadastro o Doca cria só o **cliente** no Asaas (`POST /v3/customers`, exige CPF/CNPJ) e grava `trial_ends_at = hoje + 7 dias`. Durante o teste não existe cobrança nenhuma.

No 8º dia o app trava em `/assinatura`, e **é ali que a assinatura nasce**: `POST /v3/subscriptions` com `cycle=MONTHLY`, `value=19.90`, `billingType` da preferência da conta e `nextDueDate = hoje` — quem chegou nessa tela está sendo barrado agora. A agência paga na página do Asaas (PIX, boleto ou cartão): **nenhum dado de cartão passa pelo Doca**.

Consequência de propósito: uma agência que testou e não voltou **nunca recebe fatura**. A cobrança só começa quando alguém tenta usar o app depois do teste.

Uma fatura paga estende o acesso até `vencimento + 30 + 5` dias (`paid_through`) — é a única coisa que o portão consulta, então o mês seguinte expira sozinho mesmo se nenhum webhook chegar.

### Autoatendimento (Perfil)
| Ação | O que faz no Asaas |
|---|---|
| **Forma de pagamento** (Escolher na hora / PIX / Boleto) | `PUT /v3/subscriptions/{id}` com `updatePendingPayments: true`, para valer também na fatura já aberta. No teste só grava a preferência, aplicada quando a assinatura nascer. |
| **Cancelar assinatura** | `DELETE /v3/subscriptions/{id}`. O Asaas apaga as cobranças em aberto e mantém as pagas — o `paid_through` fica de pé, então o mês já pago continua valendo. |
| **Reativar** | Abre uma assinatura nova, preservando a forma de pagamento escolhida. Uma assinatura cancelada **nunca** é recriada automaticamente. |

### Webhook
Criar em **Integrações → Webhooks** (ou `POST /v3/webhooks`):

| Campo | Valor |
|---|---|
| URL | `https://<app>/api/asaas/webhook` |
| `authToken` | o mesmo `ASAAS_WEBHOOK_TOKEN` (32–255 caracteres, sem espaços) |
| `sendType` | `SEQUENTIALLY` |
| Eventos | `PAYMENT_CREATED`, `PAYMENT_UPDATED`, `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `PAYMENT_CHARGEBACK_REQUESTED`, `SUBSCRIPTION_DELETED` |

O Asaas manda o token no header `asaas-access-token`; sem `ASAAS_WEBHOOK_TOKEN` no ambiente a rota responde **503** em vez de aceitar qualquer POST. A entrega é *at least once*: o id do evento é chave primária de `asaas_event` e é gravado na **mesma transação** da mudança de estado, então uma falha volta pela retentativa do Asaas em vez de ficar marcada como processada.

Sem webhook o app continua funcionando: a tela `/assinatura` e o botão **“Já paguei”** releem as cobranças direto na API. É assim que se testa em dev, onde não há URL pública.

### Testar pagamento localmente
`scripts/asaas-sandbox.mjs` fecha o ciclo sem sair do terminal. Ele **recusa chave que não seja de sandbox**, para nunca dar baixa numa cobrança real.

```bash
node scripts/asaas-sandbox.mjs travar  conta@exemplo.com   # fim do teste = ontem
# recarregue o app: a assinatura nasce e a fatura aparece
node scripts/asaas-sandbox.mjs fatura  conta@exemplo.com   # id, vencimento e link da cobrança
node scripts/asaas-sandbox.mjs pagar   conta@exemplo.com   # baixa via POST /payments/{id}/receiveInCash
node scripts/asaas-sandbox.mjs webhook conta@exemplo.com   # dispara PAYMENT_RECEIVED no endpoint local
```

Depois do `webhook` o app destrava sozinho. Sem ele, o botão **“Já paguei”** faz o mesmo lendo a API.

Três formas de simular o dinheiro entrando, da mais rápida à mais fiel:

1. **`pagar` + `webhook`** — não toca no navegador, cobre o caminho inteiro do lado do app.
2. **Pagar a fatura de verdade** — abra o `link` do comando `fatura` e pague com o cartão de teste do sandbox: **`4444 4444 4444 4444`**, validade futura qualquer, CVV `123`. (`5184019740373151` e `4916561358240741` são recusados de propósito.) Gera os eventos reais no Asaas.
3. **Webhook real do Asaas** — precisa de URL pública. Suba um túnel (`npx localtunnel --port 3000`) e cadastre a URL dele em Integrações → Webhooks do sandbox, com o `ASAAS_WEBHOOK_TOKEN` do `.env`. É o único jeito de testar a entrega do Asaas de ponta a ponta.

### Ambiente
O ambiente sai do **prefixo da chave** (`$aact_prod_` → produção, `$aact_hmlg_` → sandbox), então não há como apontar a chave de produção para o sandbox. `ASAAS_ENV` só existe para chaves antigas, emitidas antes desse padrão.

> Em arquivos `.env` o `$` precisa de barra (`\$aact_...`): o Next expande `$VAR` e a chave chegaria vazia. No painel da Vercel isso não se aplica.

## 6. Primeiro acesso
Não há seed em produção. Crie a conta pela tela de **Cadastro** (a verificação por e-mail está desativada no MVP — a conta já entra ativa), que leva ao **onboarding de locais** onde os locais de guarda são nomeados.

O `npm run db:seed` é só para desenvolvimento (`operador@estoque.dev` / `senha123`) — o usuário demo nasce com 7 dias de teste, então rodar o seed de novo renova o prazo.

Contas criadas **antes** da cobrança existir ficam com `trial_ends_at` nulo e continuam entrando sem assinatura: a migration não podia trancar quem já estava operando.

## CI
`.github/workflows/ci.yml` roda em cada push/PR:
- **quality:** lint · typecheck · testes unitários (Vitest) · build
- **e2e:** Postgres de serviço + migrate + seed + Playwright (fluxo login→receber→entregar)

O CI não exercita upload de foto, então não precisa do `BLOB_READ_WRITE_TOKEN`.
