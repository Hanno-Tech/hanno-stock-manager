import 'server-only';
import { redirect } from 'next/navigation';
import type { Subscription, User } from '@/db/schema';
import { billingFor, type BillingVerdict } from '@/lib/billing/state';
import { getSubscription } from './subscription';

export type BillingState = BillingVerdict & { subscription: Subscription | null };

export async function getBillingState(user: User): Promise<BillingState> {
  const subscription = await getSubscription(user.id);
  return { ...billingFor(user, subscription), subscription };
}

/**
 * Portão de acesso da área autenticada. Fica em `requireUser`, e não no
 * `proxy`, porque a decisão depende do banco: o proxy roda em toda requisição e
 * só tem o JWT na mão.
 */
export async function requireBilling(user: User): Promise<BillingState> {
  const state = await getBillingState(user);
  if (!state.allowed) redirect('/assinatura');
  return state;
}
