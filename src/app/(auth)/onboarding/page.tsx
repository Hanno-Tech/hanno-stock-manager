import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/auth/queries';
import { requireBilling } from '@/features/billing/access';
import OnboardingView from '@/features/auth/OnboardingView';

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  // Quem deixou o teste passar sem pagar precisa resolver a mensalidade antes
  // de cadastrar locais — senão configura o app todo e trava na primeira tela.
  await requireBilling(user);
  if (user.onboardedAt) redirect('/app');
  return <OnboardingView name={user.name} />;
}
