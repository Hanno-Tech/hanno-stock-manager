import 'server-only';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getSession } from '@/lib/auth/session';
import { requireBilling } from '@/features/billing/access';

/** Retorna o usuário logado (do banco) ou null. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  return user ?? null;
}

/**
 * Exige usuário autenticado, com mensalidade em dia e onboarded — senão
 * redireciona. A cobrança vem antes do onboarding: quem está travado precisa
 * pagar, e não cadastrar locais.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  await requireBilling(user);
  if (!user.onboardedAt) redirect('/onboarding');
  return user;
}
