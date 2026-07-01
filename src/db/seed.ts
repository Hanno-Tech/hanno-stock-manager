/**
 * Seed de dados de exemplo — Estoque Rápido.
 * Autossuficiente: conexão própria via .env + imports relativos (roda sob tsx).
 *
 *   npm run db:seed
 */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import * as schema from './schema';

const { users, sizeCategories, shelves, positions, items, movements } = schema;

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(sql, { schema, casing: 'snake_case' });

/** Gera o rótulo padrão de uma posição (P-01, P-02, …). */
const slotLabel = (n: number) => `P-${String(n).padStart(2, '0')}`;

async function main() {
  console.log('🌱 Limpando tabelas...');
  // Ordem respeita as FKs.
  await db.delete(movements);
  await db.delete(items);
  await db.delete(positions);
  await db.delete(shelves);
  await db.delete(sizeCategories);
  await db.delete(users);

  // --- Usuário demo ------------------------------------------------------
  console.log('👤 Criando usuário demo...');
  const passwordHash = await bcrypt.hash('senha123', 10);
  const [demoUser] = await db
    .insert(users)
    .values({
      email: 'operador@estoque.dev',
      name: 'Operador Demo',
      passwordHash,
      emailVerifiedAt: new Date(),
      onboardedAt: new Date(),
    })
    .returning();

  // --- Categorias --------------------------------------------------------
  console.log('📦 Criando categorias...');
  const cats = await db
    .insert(sizeCategories)
    .values([
      { code: 'P', name: 'Pequeno', description: 'Itens até 5kg', maxWeightKg: '5', sortOrder: 1 },
      { code: 'M', name: 'Médio', description: 'Itens até 20kg', maxWeightKg: '20', sortOrder: 2 },
      { code: 'G', name: 'Grande', description: 'Paletes e Cargas Pesadas', sortOrder: 3 },
    ])
    .returning();
  const catByCode = Object.fromEntries(cats.map((c) => [c.code, c]));

  // --- Estantes + posições ----------------------------------------------
  console.log('🗄️  Criando estantes e posições...');
  const shelfSpecs = [
    { code: 'P-01', category: 'P', aisle: 'P', level: 1, capacity: 12 },
    { code: 'P-02', category: 'P', aisle: 'P', level: 2, capacity: 12 },
    { code: 'M-01', category: 'M', aisle: 'M', level: 1, capacity: 10 },
    { code: 'M-02', category: 'M', aisle: 'M', level: 2, capacity: 10 },
    { code: 'G-01', category: 'G', aisle: 'G', level: 1, capacity: 12 },
    { code: 'G-03', category: 'G', aisle: 'G', level: 3, capacity: 12 },
  ] as const;

  const positionsByShelf: Record<string, schema.Position[]> = {};
  for (const spec of shelfSpecs) {
    const [shelf] = await db
      .insert(shelves)
      .values({
        code: spec.code,
        categoryId: catByCode[spec.category].id,
        aisle: spec.aisle,
        level: spec.level,
        capacity: spec.capacity,
      })
      .returning();

    const rows = Array.from({ length: spec.capacity }, (_, i) => ({
      shelfId: shelf.id,
      label: slotLabel(i + 1),
      slotNumber: i + 1,
    }));
    positionsByShelf[spec.code] = await db.insert(positions).values(rows).returning();
  }

  // --- Itens em estoque (ocupam posições) -------------------------------
  console.log('📥 Criando itens em estoque + movimentos de ENTRADA...');
  // Ocupa ~66% da estante G-01 (8 de 12 posições) para bater com o design.
  const g01 = positionsByShelf['G-01'];
  const inStock = [
    { code: 'ML-987234-A', size: 'G' as const, slot: 1, note: 'Cliente: Loja Centro' },
    { code: 'ML-123456-X', size: 'G' as const, slot: 2, note: null },
    { code: '8842-K', size: 'M' as const, slot: 3, note: null },
    { code: '7742-Z', size: 'M' as const, slot: 4, note: 'Frágil' },
    { code: '3321-B', size: 'M' as const, slot: 6, note: null },
    { code: '4419-E', size: 'M' as const, slot: 7, note: null },
    { code: '5590-D', size: 'G' as const, slot: 9, note: 'Baixo estoque' },
    { code: '7720-E', size: 'G' as const, slot: 11, note: null },
  ];

  for (const it of inStock) {
    const pos = g01.find((p) => p.slotNumber === it.slot)!;
    const [item] = await db
      .insert(items)
      .values({
        trackingCode: it.code,
        sizeCode: it.size,
        status: 'AGUARDANDO_RETIRADA',
        positionId: pos.id,
        customerNote: it.note,
      })
      .returning();
    await db.update(positions).set({ status: 'OCUPADA' }).where(eq(positions.id, pos.id));
    await db.insert(movements).values({
      itemId: item.id,
      type: 'ENTRADA',
      toPositionId: pos.id,
      actorId: demoUser.id,
    });
  }

  // --- Itens já entregues (para Histórico / KPIs) -----------------------
  console.log('📤 Criando entregas (histórico)...');
  const delivered = [
    { code: 'SKU-9821-A', size: 'M' as const, to: 'João Silva' },
    { code: 'SKU-4412-B', size: 'G' as const, to: null },
    { code: 'SKU-7734-C', size: 'P' as const, to: 'Maria Costa' },
    { code: 'SKU-1109-M', size: 'M' as const, to: 'Carlos Souza' },
  ];
  for (const d of delivered) {
    const [item] = await db
      .insert(items)
      .values({
        trackingCode: d.code,
        sizeCode: d.size,
        status: 'ENTREGUE',
        deliveredAt: new Date(),
        deliveredTo: d.to,
      })
      .returning();
    await db.insert(movements).values([
      { itemId: item.id, type: 'ENTRADA', actorId: demoUser.id },
      { itemId: item.id, type: 'ENTREGA', actorId: demoUser.id, note: d.to },
    ]);
  }

  console.log('✅ Seed concluído.');
  console.log('   Login demo:  operador@estoque.dev / senha123');
  await sql.end();
}

main().catch(async (err) => {
  console.error('❌ Erro no seed:', err);
  await sql.end();
  process.exit(1);
});
