/**
 * Schema do banco (Drizzle ORM) — Estoque Rápido.
 * Ver docs/DATA_MODEL.md para a documentação do modelo.
 */
import { relations } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const sizeEnum = pgEnum('size', ['P', 'M', 'G']);
export const itemStatusEnum = pgEnum('item_status', ['AGUARDANDO_RETIRADA', 'ENTREGUE']);
export const positionStatusEnum = pgEnum('position_status', ['LIVRE', 'OCUPADA']);
export const movementTypeEnum = pgEnum('movement_type', [
  'ENTRADA',
  'ENTREGA',
  'REPOSICIONAMENTO',
]);

// ---------------------------------------------------------------------------
// Usuários (operadores)
// ---------------------------------------------------------------------------
export const users = pgTable('user', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  verificationCode: text('verification_code'),
  onboardedAt: timestamp('onboarded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Categorias de armazenamento (P / M / G)
// ---------------------------------------------------------------------------
export const sizeCategories = pgTable('size_category', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: sizeEnum('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  maxWeightKg: numeric('max_weight_kg'),
  sortOrder: integer('sort_order').notNull().default(0),
});

// ---------------------------------------------------------------------------
// Estantes
// ---------------------------------------------------------------------------
export const shelves = pgTable('shelf', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => sizeCategories.id),
  aisle: text('aisle'),
  level: integer('level'),
  capacity: integer('capacity').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Posições (slots dentro da estante)
// ---------------------------------------------------------------------------
export const positions = pgTable(
  'position',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    shelfId: uuid('shelf_id')
      .notNull()
      .references(() => shelves.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    slotNumber: integer('slot_number').notNull(),
    status: positionStatusEnum('status').notNull().default('LIVRE'),
  },
  (t) => [unique('uq_position_slot').on(t.shelfId, t.slotNumber)],
);

// ---------------------------------------------------------------------------
// Itens / mercadorias
// ---------------------------------------------------------------------------
export const items = pgTable('item', {
  id: uuid('id').defaultRandom().primaryKey(),
  trackingCode: text('tracking_code').notNull().unique(),
  sizeCode: sizeEnum('size_code').notNull(),
  status: itemStatusEnum('status').notNull().default('AGUARDANDO_RETIRADA'),
  positionId: uuid('position_id').references(() => positions.id),
  customerNote: text('customer_note'),
  photoUrl: text('photo_url'),
  receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  deliveredTo: text('delivered_to'),
});

// ---------------------------------------------------------------------------
// Movimentações (log append-only) — fonte de verdade de histórico/KPIs
// ---------------------------------------------------------------------------
export const movements = pgTable('movement', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id')
    .notNull()
    .references(() => items.id),
  type: movementTypeEnum('type').notNull(),
  fromPositionId: uuid('from_position_id').references(() => positions.id),
  toPositionId: uuid('to_position_id').references(() => positions.id),
  actorId: uuid('actor_id').references(() => users.id),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const sizeCategoriesRelations = relations(sizeCategories, ({ many }) => ({
  shelves: many(shelves),
}));

export const shelvesRelations = relations(shelves, ({ one, many }) => ({
  category: one(sizeCategories, {
    fields: [shelves.categoryId],
    references: [sizeCategories.id],
  }),
  positions: many(positions),
}));

export const positionsRelations = relations(positions, ({ one }) => ({
  shelf: one(shelves, { fields: [positions.shelfId], references: [shelves.id] }),
  item: one(items, { fields: [positions.id], references: [items.positionId] }),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  position: one(positions, { fields: [items.positionId], references: [positions.id] }),
  movements: many(movements),
}));

export const movementsRelations = relations(movements, ({ one }) => ({
  item: one(items, { fields: [movements.itemId], references: [items.id] }),
  actor: one(users, { fields: [movements.actorId], references: [users.id] }),
}));

// ---------------------------------------------------------------------------
// Tipos inferidos
// ---------------------------------------------------------------------------
export type User = typeof users.$inferSelect;
export type SizeCategory = typeof sizeCategories.$inferSelect;
export type Shelf = typeof shelves.$inferSelect;
export type Position = typeof positions.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Movement = typeof movements.$inferSelect;
