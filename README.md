# Estoque Rápido

App **mobile-first** de gestão de estoque de galpão (StockScan Flow).
Stack: **Next.js 16 (App Router) · React 19 · TypeScript · MUI v9 · PostgreSQL 16 · Drizzle ORM · Node 24 LTS**.

📄 Planejamento: [`docs/PLAN.md`](docs/PLAN.md) · Modelo de dados: [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md)

## Pré-requisitos
- Node 24 LTS (`nvm use`)
- Docker (Postgres + MinIO)

## Setup

```bash
nvm use                 # Node 24
cp .env.example .env     # ajuste segredos se necessário
npm install
npm run db:up            # sobe Postgres (porta 5433) + MinIO
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
| `npm run db:up` / `db:down` | Sobe/derruba containers (Postgres + MinIO) |
| `npm run db:generate` | Gera migration a partir do schema Drizzle |
| `npm run db:migrate` | Aplica migrations |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Popula dados de exemplo |

## Serviços locais
- App: http://localhost:3000
- Postgres: `localhost:5433` (`estoque` / `estoque`)
- MinIO API: http://localhost:9000 · Console: http://localhost:9001 (`minio` / `minio12345`)
