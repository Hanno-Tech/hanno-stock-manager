/**
 * Seed de dados de exemplo — Doca App.
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

const { users, storageLocations, positions, items, movements } = schema;

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(sql, { schema, casing: 'snake_case' });

/** Rótulo da vaga dentro do local: 01, 02, … */
const slotLabel = (n: number) => String(n).padStart(2, '0');

async function main() {
  console.log('🌱 Limpando tabelas...');
  // Ordem respeita as FKs.
  await db.delete(movements);
  await db.delete(items);
  await db.delete(positions);
  await db.delete(storageLocations);
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

  // --- Locais de guarda + vagas -----------------------------------------
  // Nomes como uma agência real falaria, não códigos abstratos.
  console.log('🗄️  Criando locais e vagas...');
  const locationSpecs = [
    { name: 'Estante 1', kind: 'ESTANTE' as const, hint: 'Atrás do balcão', capacity: 12 },
    { name: 'Estante 2', kind: 'ESTANTE' as const, hint: 'Corredor do fundo', capacity: 12 },
    { name: 'Caixa 1', kind: 'CAIXA' as const, hint: 'Embaixo do balcão', capacity: 8 },
    { name: 'Caixa 2', kind: 'CAIXA' as const, hint: null, capacity: 8 },
    { name: 'Pallet do fundo', kind: 'PALLET' as const, hint: 'Volumes grandes', capacity: 6 },
  ];

  const positionsByLocation: Record<string, schema.Position[]> = {};
  let order = 1;
  for (const spec of locationSpecs) {
    const [loc] = await db
      .insert(storageLocations)
      .values({
        ownerId: demoUser.id,
        name: spec.name,
        kind: spec.kind,
        hint: spec.hint,
        capacity: spec.capacity,
        sortOrder: order++,
      })
      .returning();

    const rows = Array.from({ length: spec.capacity }, (_, i) => ({
      locationId: loc.id,
      label: slotLabel(i + 1),
      slotNumber: i + 1,
    }));
    positionsByLocation[spec.name] = await db.insert(positions).values(rows).returning();
  }

  // --- Itens em estoque (ocupam vagas) ----------------------------------
  console.log('📥 Criando itens em estoque + movimentos de ENTRADA...');
  const inStock = [
    { code: 'ML-987234-A', location: 'Estante 1', slot: 1, note: 'Ana Paula · 11 98877-1122' },
    { code: 'ML-123456-X', location: 'Estante 1', slot: 2, note: null },
    { code: '8842-K', location: 'Estante 1', slot: 3, note: 'Frágil' },
    { code: '7742-Z', location: 'Estante 1', slot: 4, note: null },
    { code: '3321-B', location: 'Estante 2', slot: 1, note: 'João Silva' },
    { code: '4419-E', location: 'Estante 2', slot: 2, note: null },
    { code: '5590-D', location: 'Caixa 1', slot: 1, note: null },
    { code: '7720-E', location: 'Caixa 1', slot: 2, note: 'Retirar até sexta' },
    { code: '9931-Q', location: 'Caixa 2', slot: 1, note: null },
    { code: 'ML-556677-B', location: 'Pallet do fundo', slot: 1, note: 'Volume grande' },
  ];

  for (const it of inStock) {
    const pos = positionsByLocation[it.location].find((p) => p.slotNumber === it.slot)!;
    const [item] = await db
      .insert(items)
      .values({
        ownerId: demoUser.id,
        trackingCode: it.code,
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
    { code: 'SKU-9821-A', to: 'João Silva' },
    { code: 'SKU-4412-B', to: null },
    { code: 'SKU-7734-C', to: 'Maria Costa' },
    { code: 'SKU-1109-M', to: 'Carlos Souza' },
  ];
  for (const d of delivered) {
    const [item] = await db
      .insert(items)
      .values({
        ownerId: demoUser.id,
        trackingCode: d.code,
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
