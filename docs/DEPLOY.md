# Deploy — MVP custo R$ 0 (Vercel + Neon + Cloudflare R2)

Stack gratuita: **Vercel Hobby** (app) · **Neon** (Postgres) · **Cloudflare R2** (fotos).
CI por **GitHub Actions** (`.github/workflows/ci.yml`).

> ⚠️ Vercel Hobby é para uso **não-comercial**. Se virar produto pago, migrar para um VPS único com o `docker-compose.yml` (Postgres + MinIO + Next) ~R$ 25–30/mês.

## 1. Banco — Neon
1. Criar projeto em https://neon.tech → banco `estoque_rapido`.
2. Copiar a **connection string** (com `?sslmode=require`).
3. Aplicar as migrations (localmente, apontando para o Neon):
   ```bash
   DATABASE_URL="postgres://...neon.tech/estoque_rapido?sslmode=require" npm run db:migrate
   # opcional: popular dados de exemplo
   DATABASE_URL="..." npm run db:seed
   ```

## 2. Fotos — Cloudflare R2
1. Criar bucket `estoque-fotos` em R2.
2. Em **Settings → Public access**, habilitar o domínio público `r2.dev` (ou custom domain) → copiar a URL (`https://pub-<hash>.r2.dev`).
3. Criar um **API Token R2** (Access Key ID + Secret).
4. Endpoint da API: `https://<account_id>.r2.cloudflarestorage.com`.

## 3. App — Vercel
1. Importar o repositório `Hanno-Tech/hanno-stock-manager` na Vercel.
2. Framework detectado: **Next.js** (nada a configurar).
3. Definir as **Environment Variables** (Production):
   | Variável | Valor |
   |---|---|
   | `DATABASE_URL` | connection string do Neon |
   | `AUTH_SECRET` | `openssl rand -base64 32` |
   | `AUTH_URL` | `https://<seu-app>.vercel.app` |
   | `S3_ENDPOINT` | `https://<account_id>.r2.cloudflarestorage.com` |
   | `S3_REGION` | `auto` |
   | `S3_ACCESS_KEY` | Access Key ID do R2 |
   | `S3_SECRET_KEY` | Secret do R2 |
   | `S3_BUCKET` | `estoque-fotos` |
   | `S3_PUBLIC_URL` | `https://pub-<hash>.r2.dev` |
4. Deploy. O HTTPS da Vercel habilita a **câmera do scanner** no celular.

## 4. Migrations em produção
As migrations **não** rodam sozinhas no deploy. A cada mudança de schema:
```bash
npm run db:generate          # gera o SQL a partir do schema
DATABASE_URL="<neon>" npm run db:migrate   # aplica no banco de produção
```
(Ou automatizar como um step no pipeline, se preferir.)

## 5. Primeiro acesso
Sem seed, crie a conta pela tela de **Cadastro** (a verificação por e-mail está desativada no MVP — a conta já entra ativa). Com seed, use `operador@estoque.dev` / `senha123`.

## CI
`.github/workflows/ci.yml` roda em cada push/PR:
- **quality:** lint · typecheck · testes unitários (Vitest) · build
- **e2e:** Postgres de serviço + migrate + seed + Playwright (fluxo login→receber→entregar)
