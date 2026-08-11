'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { positions, storageLocations } from '@/db/schema';
import { getSession } from '@/lib/auth/session';
import { LOCATION_KINDS } from './format';

const locationSchema = z.object({
  name: z.string().trim().min(1, 'Dê um nome ao local'),
  kind: z.enum(LOCATION_KINDS),
  hint: z.string().trim().optional(),
  capacity: z.coerce.number().int().min(1, 'Capacidade mínima 1').max(500),
});

export type LocationFormState = { error?: string };

/** Rótulo da vaga dentro do local: 01, 02, … */
const slotLabel = (n: number) => String(n).padStart(2, '0');

/** Cria o local e gera suas vagas numeradas. Assume que a sessão já foi validada. */
async function insertLocation(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  ownerId: string,
  data: { name: string; kind: (typeof LOCATION_KINDS)[number]; hint?: string; capacity: number },
  sortOrder: number,
) {
  const [loc] = await tx
    .insert(storageLocations)
    .values({
      ownerId,
      name: data.name,
      kind: data.kind,
      hint: data.hint || null,
      capacity: data.capacity,
      sortOrder,
    })
    .returning();

  await tx.insert(positions).values(
    Array.from({ length: data.capacity }, (_, i) => ({
      locationId: loc.id,
      label: slotLabel(i + 1),
      slotNumber: i + 1,
    })),
  );
  return loc;
}

async function nextSortOrder(ownerId: string): Promise<number> {
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${storageLocations.sortOrder}), 0)`.mapWith(Number) })
    .from(storageLocations)
    .where(eq(storageLocations.ownerId, ownerId));
  return (row?.max ?? 0) + 1;
}

export async function createLocation(
  _: LocationFormState,
  formData: FormData,
): Promise<LocationFormState> {
  const parsed = locationSchema.safeParse({
    name: formData.get('name'),
    kind: formData.get('kind'),
    hint: formData.get('hint') || undefined,
    capacity: formData.get('capacity'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const session = await getSession();
  if (!session) redirect('/login');

  const sortOrder = await nextSortOrder(session.userId);
  try {
    await db.transaction((tx) => insertLocation(tx, session.userId, parsed.data, sortOrder));
  } catch {
    return { error: 'Já existe um local com esse nome' };
  }

  revalidatePath('/app');
  revalidatePath('/app/locais');
  redirect('/app/locais');
}

const bulkSchema = z.object({
  locations: z
    .array(locationSchema)
    .min(1, 'Cadastre ao menos um local')
    .max(50, 'Muitos locais de uma vez'),
});

/**
 * Cria vários locais de uma vez — usado no onboarding, onde a agência
 * descreve o espaço dela antes de começar a operar.
 */
export async function createLocationsBulk(
  input: z.input<typeof bulkSchema>,
): Promise<LocationFormState> {
  const parsed = bulkSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const session = await getSession();
  if (!session) redirect('/login');

  const names = parsed.data.locations.map((l) => l.name.toLowerCase());
  if (new Set(names).size !== names.length) return { error: 'Há nomes repetidos na lista' };

  try {
    await db.transaction(async (tx) => {
      let order = 1;
      for (const loc of parsed.data.locations) {
        await insertLocation(tx, session.userId, loc, order++);
      }
    });
  } catch {
    return { error: 'Não foi possível criar os locais. Verifique os nomes.' };
  }

  revalidatePath('/app');
  revalidatePath('/app/locais');
  return {};
}

/** Remove um local do próprio usuário (as vagas caem em cascata). */
export async function deleteLocation(id: string): Promise<void> {
  const session = await getSession();
  if (!session) redirect('/login');
  await db
    .delete(storageLocations)
    .where(and(eq(storageLocations.id, id), eq(storageLocations.ownerId, session.userId)));
  revalidatePath('/app');
  revalidatePath('/app/locais');
  redirect('/app/locais');
}
