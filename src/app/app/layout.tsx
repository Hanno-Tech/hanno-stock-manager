import { requireUser } from '@/features/auth/queries';
import { AppShell } from '@/components';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <AppShell>{children}</AppShell>;
}
