import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/auth/queries';

/** Splash / entrada: decide o destino conforme o estado da conta. */
export default async function RootPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.onboardedAt) redirect('/onboarding');
  redirect('/app');
}
