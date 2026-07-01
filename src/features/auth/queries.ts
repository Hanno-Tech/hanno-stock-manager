import 'server-only';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getSession } from '@/lib/auth/session';

/** Retorna o usuário logado (do banco) ou null. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  return user ?? null;
}

/** Exige usuário autenticado e onboarded — senão redireciona. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.onboardedAt) redirect('/onboarding');
  return user;
}
