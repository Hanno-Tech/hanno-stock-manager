'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { shelves, positions, sizeCategories } from '@/db/schema';

const schema = z.object({
  code: z.string().min(1, 'Informe o código'),
  category: z.enum(['P', 'M', 'G']),
  aisle: z.string().optional(),
  level: z.coerce.number().int().positive().optional(),
  capacity: z.coerce.number().int().min(1, 'Capacidade mínima 1').max(200),
});

export type ShelfFormState = { error?: string };

const slotLabel = (n: number) => `P-${String(n).padStart(2, '0')}`;

/** Cria uma estante e gera suas posições (P-01 … P-NN). */
export async function createShelf(_: ShelfFormState, formData: FormData): Promise<ShelfFormState> {
  const parsed = schema.safeParse({
    code: formData.get('code'),
    category: formData.get('category'),
    aisle: formData.get('aisle') || undefined,
    level: formData.get('level') || undefined,
    capacity: formData.get('capacity'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const [cat] = await db
    .select()
    .from(sizeCategories)
    .where(eq(sizeCategories.code, data.category))
    .limit(1);
  if (!cat) return { error: 'Categoria inválida' };

  try {
    await db.transaction(async (tx) => {
      const [shelf] = await tx
        .insert(shelves)
        .values({
          code: data.code.trim(),
          categoryId: cat.id,
          aisle: data.aisle?.trim() || null,
          level: data.level ?? null,
          capacity: data.capacity,
        })
        .returning();

      await tx.insert(positions).values(
        Array.from({ length: data.capacity }, (_, i) => ({
          shelfId: shelf.id,
          label: slotLabel(i + 1),
          slotNumber: i + 1,
        })),
      );
    });
  } catch {
    return { error: 'Já existe uma estante com esse código' };
  }

  revalidatePath('/app/estantes');
  redirect('/app/estantes');
}

/** Remove uma estante (as posições caem em cascata). */
export async function deleteShelf(id: string): Promise<void> {
  await db.delete(shelves).where(eq(shelves.id, id));
  revalidatePath('/app/estantes');
  redirect('/app/estantes');
}
