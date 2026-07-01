# Estoque Rápido — Plano de Desenvolvimento

> App **mobile-first** de gestão de estoque de galpão. Origem do design: [Stitch — StockScan Flow](https://stitch.withgoogle.com/projects/4439944846464774021).
> Perfil de usuário: operadores de galpão e supervisores de piso — navegação "de uma mão só", leitura de dados imediata, foco em velocidade de escaneamento.

---

## 1. Stack Técnica

| Camada | Escolha | Observação |
|---|---|---|
| Runtime | **Node.js 24 LTS** | `.nvmrc` = `24`, `engines.node: ">=24"` |
| Framework | **Next.js 15 (App Router)** + React 19 | SSR/RSC + Route Handlers + Server Actions |
| Linguagem | **TypeScript** (strict) | |
| UI | **MUI v6** (`@mui/material`) + Emotion | Integração App Router via `@mui/material-nextjs` |
| Ícones | `@mui/icons-material` (variante **outlined**) | Design pede stroke 2px, estilo outline |
| Banco | **PostgreSQL 16** | `docker-compose` para dev |
| ORM / Migrations | **Drizzle ORM + drizzle-kit** | TypeScript-native, migrations versionadas — **não é Prisma** ✅ |
| Driver | `postgres` (postgres.js) ou `pg` | postgres.js recomendado |
| Auth | **Auth.js v5 (NextAuth)** — credentials + verificação por e-mail | Alternativa: Lucia |
| Data fetching (client) | **TanStack Query v5** | Cache/otimistic updates para steppers e listas |
| Validação | **Zod** | Schemas compartilhados client/server |
| Scanner | **`@zxing/browser`** (fallback: `BarcodeDetector` API nativa) | Leitura de código via câmera |
| Storage de fotos | S3-compatível (MinIO em dev) via presigned URL | Foto opcional do item |
| Testes | Vitest (unit) + Playwright (e2e) | |
| Qualidade | ESLint + Prettier + TypeScript strict | |

> **Por que Drizzle e não Knex/Kysely puro?** Drizzle dá schema tipado + `drizzle-kit generate/migrate` (migrations SQL versionadas) + query builder tipado, sem o runtime/geração de client do Prisma. Se preferir migrations SQL "cruas", as alternativas válidas são **node-pg-migrate** ou **Kysely + kysely-ctl**.

---

## 2. Design System (tokens do Stitch → tema MUI)

O `designMd` do projeto já define todos os tokens. Mapear para `createTheme`:

- **Cores** (light, alta legibilidade WCAG AA 4.5:1):
  - `primary` `#2563eb` (Indigo) — ações/navegação
  - `secondary` / success `#10b981` (Emerald) — em estoque / concluído
  - `warning` `#f59e0b` (Amber) — estoque baixo / pendente
  - `error` `#ba1a1a` — ruptura / erro
  - `background` `#f8f9ff`, superfícies em tons de cinza-azulado
- **Tipografia** (dual-font):
  - **Hanken Grotesk** → UI (labels, headings, corpo). Body mínimo **16px**.
  - **JetBrains Mono** → SKU, códigos, quantidades, seriais (evita ambiguidade 0/O, 1/l). Mapear como `variant="code"` custom ou família dedicada.
- **Forma:** raios 4–8px em botões/inputs/cards; **pills totalmente arredondadas** para status.
- **Espaçamento:** grid base 4px; margens 16px (mobile) / 24px (tablet).
- **Elevação:** camadas tonais + borda 1px `#E2E8F0` (sem sombra pesada); sombra suave só em FAB/flutuantes.
- **Thumb zone:** ações-chave (Escanear, Salvar, Confirmar) nos 40% inferiores da tela.

Ver `docs/DESIGN_TOKENS.md` (gerado na Fase 1) para o objeto de tema completo.

---

## 3. Modelo de Domínio

Ver **`docs/DATA_MODEL.md`** para o schema Drizzle/SQL completo. Entidades principais:

- **user** — operadores; verificação de conta.
- **size_category** (Pequeno ≤5kg / Médio ≤20kg / Grande/Paletes) — categorias de armazenamento.
- **shelf** (estante) — código `G-01`, corredor, nível, capacidade, categoria.
- **position** (posição) — slot `P-01`…`P-12` numa estante; ocupado/livre.
- **item** (mercadoria) — código de rastreio/SKU, tamanho, status (`AGUARDANDO_RETIRADA` / `ENTREGUE`), posição, foto, cliente/obs, recebido_em.
- **movement** — log imutável de eventos (ENTRADA, ENTREGA, REPOSICIONAMENTO) → alimenta Histórico e KPIs.

---

## 4. Telas → Rotas → Componentes

| Tela (Stitch) | Rota | Notas |
|---|---|---|
| Splash Screen | `/` (redirect) | Verifica sessão → dashboard ou login |
| Login | `/login` | Auth.js credentials |
| Cadastro | `/cadastro` | |
| Verificação de Conta | `/verificar` | Código por e-mail |
| Tutorial de Boas-vindas | `/onboarding` | Só no 1º acesso |
| Dashboard - Início | `/app` | KPIs: Total em Estoque, Recebidos Hoje, Distribuição P/M/G + busca |
| Receber - Classificar | `/app/receber` | Scan → tamanho → **posição sugerida** → cliente/obs → salvar |
| Detalhe do Item / Busca | `/app/itens/[id]` | Status, posição, foto, **Confirmar Entrega**, Editar Posição |
| Gerenciar Estantes | `/app/estantes` | Visão por categoria + atividade recente + FAB add |
| Detalhes da Estante | `/app/estantes/[id]` | Grid de posições 1–12, ocupação %, editar/remover |
| Adicionar Estante | `/app/estantes/nova` | |
| Histórico de Entregas | `/app/historico` | Entregas por dia/mês |
| Perfil | `/app/perfil` | Bottom nav tab |

**AppShell:** bottom navigation persistente (Início / Receber / Histórico / Perfil) na thumb zone + FAB contextual.

---

## 5. Lógica-chave: sugestão de posição

No recebimento, dado o **tamanho** lido:
1. Filtrar estantes da **categoria compatível** (P→Pequeno, M→Médio, G→Grande).
2. Encontrar a **primeira posição livre** (ordem corredor→nível→número).
3. Sugerir ao operador (ex.: `G-03 · Pos. 07`), permitindo override manual.
4. Ao salvar: criar `item`, ocupar `position`, gravar `movement` tipo `ENTRADA` (transação).

Confirmar entrega: `item.status → ENTREGUE`, liberar `position`, gravar `movement` tipo `ENTREGA` com `cliente`.

---

## 6. API / Camada de dados

- **Server Components** para leitura (dashboard, listas, detalhes).
- **Server Actions** para mutações simples (salvar entrada, confirmar entrega, CRUD estante).
- **Route Handlers** (`/api/*`) para: upload de foto (presigned), busca por SKU (usada pelo scanner), e endpoints consumidos por TanStack Query onde há otimistic UI.
- Toda mutação de estoque roda em **transação** e grava um `movement` (fonte única de verdade do histórico/KPIs).
- Validação Zod na borda; schemas em `src/lib/schemas`.

---

## 7. Fases de Entrega

### Fase 0 — Fundação (infra) 🏗️
- [ ] `create-next-app` (TS, App Router), Node 24, `.nvmrc`, ESLint/Prettier
- [ ] MUI v6 + Emotion + `AppRouterCacheProvider` (SSR sem flicker)
- [ ] `docker-compose.yml`: Postgres 16 + MinIO
- [ ] Drizzle + drizzle-kit configurados; `.env` + validação de env (Zod)
- [ ] Estrutura de pastas (`src/app`, `src/components`, `src/lib`, `src/db`, `src/features`)

### Fase 1 — Design System 🎨
- [ ] Tema MUI a partir dos tokens do Stitch (`docs/DESIGN_TOKENS.md`)
- [ ] Fontes Hanken Grotesk + JetBrains Mono (`next/font`)
- [ ] Componentes base: `AppShell`+BottomNav, `FAB`, `StatusPill`, `SegmentedControl` (P/M/G), `QuantityStepper` (48×48), `InventoryCard`, `SearchBar` (com ícone scan), `FloatingLabelField`
- [ ] Layout mobile-first + safe-area + thumb zone

### Fase 2 — Banco & Migrations 🗄️
- [ ] Schema Drizzle (`docs/DATA_MODEL.md`)
- [ ] `drizzle-kit generate` + `migrate`; script de **seed** (categorias, estantes exemplo, itens)
- [ ] Camada de repositório/queries tipadas

### Fase 3 — Autenticação 🔐
- [ ] Auth.js v5 (credentials + hash argon2/bcrypt)
- [ ] Splash → Login → Cadastro → Verificação (código por e-mail) → Onboarding
- [ ] Middleware de proteção de rotas `/app/*`

### Fase 4 — Núcleo de Estoque 📦
- [ ] Dashboard com KPIs (total, recebidos hoje, distribuição P/M/G)
- [ ] Gerenciar Estantes (categorias + atividade recente) / Adicionar Estante
- [ ] Detalhe da Estante (grid de posições, ocupação, editar/remover)
- [ ] Detalhe do Item (status, posição, foto, editar posição)
- [ ] Busca por SKU

### Fase 5 — Fluxos de movimentação 🔄
- [ ] Receber Mercadoria (com sugestão de posição) + `movement` ENTRADA
- [ ] Confirmar Entrega + `movement` ENTREGA
- [ ] Histórico de Entregas (agrupado por dia)

### Fase 6 — Scanner & Foto 📷
- [ ] Leitura de código de barras via câmera (`@zxing/browser` + fallback nativo)
- [ ] Upload de foto opcional (presigned URL → MinIO/S3)

### Fase 7 — Polimento, PWA & Deploy 🚀
- [ ] PWA (manifest + service worker) para instalar no celular; considerar cache offline de leitura
- [ ] A11y (contraste AA, touch targets ≥48px, foco) e i18n pt-BR
- [ ] Testes: Vitest (lógica de sugestão/transações) + Playwright (fluxo receber→entregar)
- [ ] CI (lint + typecheck + test + build) e deploy (Vercel/Docker + Postgres gerenciado)

---

## 8. Estrutura de Pastas (proposta)

```
src/
  app/
    (auth)/login, cadastro, verificar, onboarding/
    app/                # área autenticada
      page.tsx          # dashboard
      receber/
      itens/[id]/
      estantes/[id]/, nova/
      historico/
      perfil/
    api/                # route handlers (upload, busca)
  components/           # design system (AppShell, cards, steppers…)
  features/             # lógica por domínio (estoque, estantes, auth)
  lib/                  # schemas zod, auth, utils, env
  db/                   # drizzle schema, client, migrations, seed
docs/
  PLAN.md, DATA_MODEL.md, DESIGN_TOKENS.md
```

---

## 9. Riscos & Decisões Abertas
- **Scanner no navegador**: `BarcodeDetector` tem suporte irregular; `@zxing/browser` cobre o gap mas exige HTTPS/permissão de câmera.
- **Multi-tenant?** Assumido single-tenant (um galpão). Se houver múltiplos galpões/empresas, adicionar `organization_id` desde a Fase 2.
- **Concorrência de posições**: dois operadores recebendo ao mesmo tempo → travar posição na transação (SELECT … FOR UPDATE) para não sugerir o mesmo slot.
- **Offline-first**: galpões têm sinal ruim; avaliar fila de mutações local (fora do MVP).
```
