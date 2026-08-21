/**
 * Schema do banco (Drizzle ORM) — Doca App.
 * Ver docs/DATA_MODEL.md para a documentação do modelo.
 */
import { relations } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  date,
  unique,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const sizeEnum = pgEnum('size', ['P', 'M', 'G']);
/** Tipo físico do local de guarda — rotula o card na UI, não restringe o que cabe nele. */
export const locationKindEnum = pgEnum('location_kind', [
  'ESTANTE',
  'CAIXA',
  'PRATELEIRA',
  'PALLET',
  'ARMARIO',
  'OUTRO',
]);
export const itemStatusEnum = pgEnum('item_status', ['AGUARDANDO_RETIRADA', 'ENTREGUE']);
export const positionStatusEnum = pgEnum('position_status', ['LIVRE', 'OCUPADA']);
export const movementTypeEnum = pgEnum('movement_type', [
  'ENTRADA',
  'ENTREGA',
  'REPOSICIONAMENTO',
]);
/** Estado da assinatura no Doca — derivado dos webhooks do Asaas. */
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'PENDENTE',
  'ATIVA',
  'VENCIDA',
  'CANCELADA',
]);

// ---------------------------------------------------------------------------
// Usuários (operadores)
// ---------------------------------------------------------------------------
export const users = pgTable('user', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  /**
   * CPF/CNPJ da agência. O Asaas não cria cliente sem documento, então o
   * cadastro passou a pedir. Nulo em DB só por causa das contas abertas antes
   * de existir cobrança.
   */
  cpfCnpj: text('cpf_cnpj'),
  /**
   * Fim do teste grátis. Nulo identifica conta anterior à cobrança: essas
   * seguem entrando sem assinatura, senão a migration trancaria quem já usa.
   */
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  verificationCode: text('verification_code'),
  onboardedAt: timestamp('onboarded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Locais de guarda — nomeados livremente pelo operador no onboarding.
// Substituem o antigo par size_category + shelf: em vez de "toda estante é P/M/G",
// a agência descreve o espaço real dela ("Estante 1", "Caixa 2", "Pallet do fundo").
// ---------------------------------------------------------------------------
export const storageLocations = pgTable(
  'storage_location',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    kind: locationKindEnum('kind').notNull().default('ESTANTE'),
    /** Dica livre de onde fica ("corredor do fundo", "atrás do balcão"). */
    hint: text('hint'),
    capacity: integer('capacity').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique('uq_location_owner_name').on(t.ownerId, t.name)],
);

// ---------------------------------------------------------------------------
// Posições (slots dentro do local)
// ---------------------------------------------------------------------------
export const positions = pgTable(
  'position',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    locationId: uuid('location_id')
      .notNull()
      .references(() => storageLocations.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    slotNumber: integer('slot_number').notNull(),
    status: positionStatusEnum('status').notNull().default('LIVRE'),
  },
  (t) => [unique('uq_position_slot').on(t.locationId, t.slotNumber)],
);

// ---------------------------------------------------------------------------
// Itens / mercadorias
// ---------------------------------------------------------------------------
export const items = pgTable(
  'item',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }),
    trackingCode: text('tracking_code').notNull(),
    /** Opcional: é só um rótulo do volume, não decide mais onde o item é guardado. */
    sizeCode: sizeEnum('size_code'),
    status: itemStatusEnum('status').notNull().default('AGUARDANDO_RETIRADA'),
    positionId: uuid('position_id').references(() => positions.id),
    /**
     * Nome de quem vai retirar. É o índice que a agência consegue construir
     * sozinha: o QR do cliente não identifica o pacote, então achar por nome é
     * o caminho que sempre funciona. Obrigatório no recebimento (validado na
     * action); nulo em DB só para não invalidar itens criados antes disso.
     */
    customerName: text('customer_name'),
    /** Opcional, mas é a segunda melhor chave de busca depois do nome. */
    customerPhone: text('customer_phone'),
    customerNote: text('customer_note'),
    photoUrl: text('photo_url'),
    receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    deliveredTo: text('delivered_to'),
    /**
     * Código de retirada do QR que o cliente apresentou (o `phrase`, ex.
     * "UNIVERSO.796520"). Gravado só na confirmação da entrega: até ali o
     * código ainda autoriza a retirada, e um banco cheio deles seria um banco
     * de credenciais. Depois de entregue está gasto, e serve de rastro.
     */
    pickupPhrase: text('pickup_phrase'),
  },
  (t) => [unique('uq_item_owner_tracking').on(t.ownerId, t.trackingCode)],
);

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
// Assinatura (Asaas)
// ---------------------------------------------------------------------------
/**
 * Estado de cobrança da conta — uma linha por agência.
 *
 * Nada disso existe durante o teste grátis: a linha só nasce quando a agência
 * manda abrir o checkout. Quem cria a assinatura e o cliente no Asaas é a
 * página de pagamento hospedada — por isso os três ids são nulos até a
 * primeira cobrança ser paga.
 */
export const subscriptions = pgTable('subscription', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  asaasCustomerId: text('asaas_customer_id'),
  asaasSubscriptionId: text('asaas_subscription_id').unique(),
  /**
   * Checkout aberto e ainda não pago. É a única chave que temos para ligar o
   * evento `CHECKOUT_PAID` de volta a esta conta: o Asaas não expõe endpoint
   * para consultar um checkout depois de criado.
   */
  checkoutId: text('checkout_id'),
  status: subscriptionStatusEnum('status').notNull().default('PENDENTE'),
  /** Forma de cobrança da assinatura. Hoje sempre CREDIT_CARD — é a única que
   *  o Asaas renova sozinho; a coluna fica para quando PIX/boleto voltarem. */
  billingType: text('billing_type'),
  /** Em centavos, como o resto do sistema conta dinheiro. */
  valueCents: integer('value_cents').notNull(),
  /** Vencimento da fatura em aberto (data pura, do jeito que o Asaas manda). */
  nextDueDate: date('next_due_date'),
  /** Página de pagamento da fatura em aberto — PIX, boleto ou cartão, no Asaas. */
  invoiceUrl: text('invoice_url'),
  /**
   * Até quando o acesso está pago. É o único campo que o portão consulta:
   * guardar uma data (e não "está pago?") faz o mês seguinte expirar sozinho,
   * mesmo que nenhum webhook chegue avisando.
   */
  paidThrough: timestamp('paid_through', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Eventos de webhook do Asaas — só para idempotência
// ---------------------------------------------------------------------------
/**
 * O Asaas entrega "at least once": o mesmo evento chega mais de uma vez. A
 * chave primária é o id do evento (`evt_…`), então o segundo POST bate no
 * unique e a rota devolve 200 sem reprocessar o pagamento.
 */
export const asaasEvents = pgTable('asaas_event', {
  id: text('id').primaryKey(),
  event: text('event').notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const usersRelations = relations(users, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.ownerId],
  }),
}));

export const storageLocationsRelations = relations(storageLocations, ({ many }) => ({
  positions: many(positions),
}));

export const positionsRelations = relations(positions, ({ one }) => ({
  location: one(storageLocations, {
    fields: [positions.locationId],
    references: [storageLocations.id],
  }),
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
export type StorageLocation = typeof storageLocations.$inferSelect;
export type LocationKind = (typeof locationKindEnum.enumValues)[number];
export type Position = typeof positions.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Movement = typeof movements.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type SubscriptionStatus = (typeof subscriptionStatusEnum.enumValues)[number];
