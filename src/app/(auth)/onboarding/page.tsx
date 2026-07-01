import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/auth/queries';
import OnboardingView from '@/features/auth/OnboardingView';

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.onboardedAt) redirect('/app');
  return <OnboardingView name={user.name} />;
}
