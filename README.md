# Doca App

App **mobile-first** para agências de retirada do Mercado Livre: recebe o pacote,
guarda num local nomeado ("Estante 1", "Caixa 2") e acha na hora em que o cliente
chega para retirar.
Stack: **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 + shadcn/ui (Base UI) · PostgreSQL 16 · Drizzle ORM · Node 24 LTS**.

📄 Planejamento: [`docs/PLAN.md`](docs/PLAN.md) · Modelo de dados: [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md)

## Pré-requisitos
- Node 24 LTS (`nvm use`)
- Docker (Postgres)

## Setup

```bash
nvm use                 # Node 24
cp .env.example .env     # ajuste segredos se necessário
npx vercel env pull      # traz o BLOB_READ_WRITE_TOKEN (fotos) para o .env.local
npm install
npm run db:up            # sobe Postgres (porta 5433)
npm run db:migrate       # aplica migrations (após a Fase 2)
npm run db:seed          # popula dados de exemplo (após a Fase 2)
npm run dev              # http://localhost:3000
```

> O Postgres é exposto na porta **5433** do host (a 5432 estava ocupada por outro serviço).

## Scripts
| Comando | Ação |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `start` | Build e execução de produção |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:up` / `db:down` | Sobe/derruba o container do Postgres |
| `npm run db:generate` | Gera migration a partir do schema Drizzle |
| `npm run db:migrate` | Aplica migrations |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Popula dados de exemplo (**apaga os usuários existentes**) |

## Serviços locais
- App: http://localhost:3000
- Postgres: `localhost:5433` (`estoque` / `estoque`)
- Fotos dos itens: **Vercel Blob** (store `doca-fotos`), inclusive em dev — ver [`docs/DEPLOY.md`](docs/DEPLOY.md)
- Cobrança: **Asaas** (assinatura de R$ 19,90/mês, teste grátis de 7 dias). Em dev use a chave do Sandbox; sem chave o app sobe e só a assinatura não é aberta — ver [`docs/DEPLOY.md`](docs/DEPLOY.md)
