# Modelo de Dados — Estoque Rápido

Postgres 16 + Drizzle ORM. Convenções: `snake_case`, PKs `uuid` (default `gen_random_uuid()`), timestamps `timestamptz`.

## Diagrama (texto)

```
user ─┐
      └─< movement >─ item ─> position ─> shelf ─> size_category
                                  └────────────────┘ (categoria do item)
```

- Uma **shelf** pertence a uma **size_category** e tem N **positions**.
- Um **item** ocupa no máximo uma **position** (0..1) enquanto `AGUARDANDO_RETIRADA`.
- Todo evento de estoque gera um **movement** (append-only) → Histórico e KPIs derivam daqui.

---

## Tabelas

### size_category — categorias de armazenamento (P/M/G)
| coluna | tipo | notas |
|---|---|---|
| id | uuid PK | |
| code | text unique | `P` / `M` / `G` |
| name | text | "Pequeno", "Médio", "Grande" |
| description | text | "Itens até 5kg", "até 20kg", "Paletes e Cargas Pesadas" |
| max_weight_kg | numeric null | 5 / 20 / null |
| sort_order | int | |

### shelf — estante
| coluna | tipo | notas |
|---|---|---|
| id | uuid PK | |
| code | text unique | `G-01` |
| category_id | uuid FK → size_category | |
| aisle | text null | corredor (ex.: "G") |
| level | int null | nível |
| capacity | int | nº de posições (ex.: 12) |
| created_at / updated_at | timestamptz | |

### position — posição/slot dentro da estante
| coluna | tipo | notas |
|---|---|---|
| id | uuid PK | |
| shelf_id | uuid FK → shelf | on delete cascade |
| label | text | `P-01` … `P-12` |
| slot_number | int | 1..capacity |
| status | enum `position_status` | `LIVRE` / `OCUPADA` |
| — | | **unique(shelf_id, slot_number)** |

### item — mercadoria
| coluna | tipo | notas |
|---|---|---|
| id | uuid PK | |
| tracking_code | text unique | SKU / código de rastreio (`ML-123456-X`) |
| size_code | enum `size` | `P` / `M` / `G` |
| status | enum `item_status` | `AGUARDANDO_RETIRADA` / `ENTREGUE` |
| position_id | uuid FK → position null | null quando entregue |
| customer_note | text null | "Nome do cliente / Obs" |
| photo_url | text null | foto opcional |
| received_at | timestamptz | recebido em |
| delivered_at | timestamptz null | |
| delivered_to | text null | ex.: "João Silva" |

### movement — log imutável de eventos (append-only)
| coluna | tipo | notas |
|---|---|---|
| id | uuid PK | |
| item_id | uuid FK → item | |
| type | enum `movement_type` | `ENTRADA` / `ENTREGA` / `REPOSICIONAMENTO` |
| from_position_id | uuid FK → position null | |
| to_position_id | uuid FK → position null | |
| actor_id | uuid FK → user null | quem executou |
| note | text null | |
| created_at | timestamptz default now() | |

### user — operador
| coluna | tipo | notas |
|---|---|---|
| id | uuid PK | |
| email | text unique | |
| name | text | |
| password_hash | text | argon2/bcrypt |
| email_verified_at | timestamptz null | verificação de conta |
| verification_code | text null | código enviado por e-mail |
| onboarded_at | timestamptz null | tutorial concluído |
| created_at | timestamptz | |

*(Auth.js pode adicionar `account`/`session`/`verification_token` conforme o adapter escolhido.)*

---

## Enums

```sql
CREATE TYPE size AS ENUM ('P','M','G');
CREATE TYPE item_status AS ENUM ('AGUARDANDO_RETIRADA','ENTREGUE');
CREATE TYPE position_status AS ENUM ('LIVRE','OCUPADA');
CREATE TYPE movement_type AS ENUM ('ENTRADA','ENTREGA','REPOSICIONAMENTO');
```

---

## Esboço do schema Drizzle (`src/db/schema.ts`)

```ts
import { pgTable, uuid, text, integer, numeric, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core';

export const sizeEnum = pgEnum('size', ['P', 'M', 'G']);
export const itemStatus = pgEnum('item_status', ['AGUARDANDO_RETIRADA', 'ENTREGUE']);
export const positionStatus = pgEnum('position_status', ['LIVRE', 'OCUPADA']);
export const movementType = pgEnum('movement_type', ['ENTRADA', 'ENTREGA', 'REPOSICIONAMENTO']);

export const sizeCategory = pgTable('size_category', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),          // P / M / G
  name: text('name').notNull(),
  description: text('description'),
  maxWeightKg: numeric('max_weight_kg'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const shelf = pgTable('shelf', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),          // G-01
  categoryId: uuid('category_id').notNull().references(() => sizeCategory.id),
  aisle: text('aisle'),
  level: integer('level'),
  capacity: integer('capacity').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const position = pgTable('position', {
  id: uuid('id').defaultRandom().primaryKey(),
  shelfId: uuid('shelf_id').notNull().references(() => shelf.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),                 // P-01
  slotNumber: integer('slot_number').notNull(),
  status: positionStatus('status').notNull().default('LIVRE'),
}, (t) => ({ uqSlot: unique().on(t.shelfId, t.slotNumber) }));

export const item = pgTable('item', {
  id: uuid('id').defaultRandom().primaryKey(),
  trackingCode: text('tracking_code').notNull().unique(),
  sizeCode: sizeEnum('size_code').notNull(),
  status: itemStatus('status').notNull().default('AGUARDANDO_RETIRADA'),
  positionId: uuid('position_id').references(() => position.id),
  customerNote: text('customer_note'),
  photoUrl: text('photo_url'),
  receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  deliveredTo: text('delivered_to'),
});

export const movement = pgTable('movement', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').notNull().references(() => item.id),
  type: movementType('type').notNull(),
  fromPositionId: uuid('from_position_id').references(() => position.id),
  toPositionId: uuid('to_position_id').references(() => position.id),
  actorId: uuid('actor_id'),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

---

## Consultas derivadas (KPIs / Dashboard)

- **Total em Estoque** = `count(item where status = 'AGUARDANDO_RETIRADA')`
- **Recebidos Hoje** = `count(movement where type='ENTRADA' and created_at::date = current_date)`
- **Distribuição por Tamanho** = `count(item) group by size_code where status='AGUARDANDO_RETIRADA'`
- **Ocupação da Estante** = `count(position OCUPADA) / capacity`
- **Entregas hoje / mês** = `count(movement type='ENTREGA')` por período
- **Estoque baixo** (badge na posição): regra de negócio a definir (ex.: item parado há > N dias)

## Transações-chave
- **Salvar entrada:** `INSERT item` → `UPDATE position SET status='OCUPADA'` → `INSERT movement(ENTRADA)`. Usar `SELECT … FOR UPDATE` na posição sugerida para evitar corrida entre operadores.
- **Confirmar entrega:** `UPDATE item(status=ENTREGUE, delivered_*)` → `UPDATE position SET status='LIVRE'` → `INSERT movement(ENTREGA)`.
- **Repor/editar posição:** `UPDATE item.position_id` → liberar antiga / ocupar nova → `INSERT movement(REPOSICIONAMENTO)`.
```
