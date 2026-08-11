import { LogOut } from 'lucide-react';
import { PageHeader } from '@/components';
import { Button } from '@/components/ui/button';
import { requireUser } from '@/features/auth/queries';
import { logoutAction } from '@/features/auth/actions';

export default async function PerfilPage() {
  const user = await requireUser();

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
        <form action={logoutAction} className="mt-6 w-full">
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
