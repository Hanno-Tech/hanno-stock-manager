import { LogOut } from 'lucide-react';
import { PageHeader } from '@/components';
import { Button } from '@/components/ui/button';
import { requireUser } from '@/features/auth/queries';
import { logoutAction } from '@/features/auth/actions';
import { getBillingState } from '@/features/billing/access';
import BillingCard from '@/features/billing/BillingCard';

export default async function PerfilPage() {
  const user = await requireUser();
  const billing = await getBillingState(user);

  return (
    <>
      <PageHeader title="Perfil" />
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="flex size-18 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="text-center">
          <h2 className="font-heading text-lg font-bold">{user.name}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="mt-4 w-full">
          <BillingCard state={billing} />
        </div>

        <form action={logoutAction} className="mt-2 w-full">
          <Button
            type="submit"
            variant="outline"
            size="lg"
            className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut />
            Sair
          </Button>
        </form>
      </div>
    </>
  );
}
