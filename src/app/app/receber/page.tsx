import { PageHeader } from '@/components';
import ReceberForm from '@/features/movements/ReceberForm';
import { listLocationsWithFreeSlots } from '@/features/locations/queries';
import { requireUser } from '@/features/auth/queries';

export default async function ReceberPage() {
  const user = await requireUser();
  const locations = await listLocationsWithFreeSlots(user.id);

  return (
    <>
      <PageHeader title="Receber Mercadoria" back />
      <div className="p-4">
        <ReceberForm locations={locations} />
      </div>
    </>
  );
}
