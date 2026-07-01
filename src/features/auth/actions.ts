'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { createSession, destroySession, getSession } from '@/lib/auth/session';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { loginSchema, registerSchema } from '@/lib/schemas/auth';

export type ActionState = { error?: string };

async function sessionFromUser(u: typeof users.$inferSelect) {
  await createSession({
    userId: u.id,
    email: u.email,
    name: u.name,
    verified: !!u.emailVerifiedAt,
    onboarded: !!u.onboardedAt,
  });
}

export async function registerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, email, password } = parsed.data;
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) return { error: 'E-mail já cadastrado' };

  // MVP: conta já criada verificada (sem etapa de e-mail).
  const [user] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash: await hashPassword(password),
      emailVerifiedAt: new Date(),
    })
    .returning();

  await sessionFromUser(user);
  redirect('/onboarding');
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: 'Credenciais inválidas' };
  }

  await sessionFromUser(user);
  if (!user.onboardedAt) redirect('/onboarding');
  redirect('/app');
}

export async function completeOnboardingAction(): Promise<void> {
  const session = await getSession();
  if (!session) redirect('/login');
  const [updated] = await db
    .update(users)
    .set({ onboardedAt: new Date() })
    .where(eq(users.id, session!.userId))
    .returning();
  if (updated) await sessionFromUser(updated);
  redirect('/app');
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/login');
}
