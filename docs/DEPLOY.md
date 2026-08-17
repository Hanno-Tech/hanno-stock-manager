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

## 5. Primeiro acesso
Não há seed em produção. Crie a conta pela tela de **Cadastro** (a verificação por e-mail está desativada no MVP — a conta já entra ativa), que leva ao **onboarding de locais** onde os locais de guarda são nomeados.

O `npm run db:seed` é só para desenvolvimento (`operador@estoque.dev` / `senha123`).

## CI
`.github/workflows/ci.yml` roda em cada push/PR:
- **quality:** lint · typecheck · testes unitários (Vitest) · build
- **e2e:** Postgres de serviço + migrate + seed + Playwright (fluxo login→receber→entregar)

O CI não exercita upload de foto, então não precisa do `BLOB_READ_WRITE_TOKEN`.
