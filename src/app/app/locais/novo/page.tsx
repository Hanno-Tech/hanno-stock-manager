import { PageHeader } from '@/components';
import NewLocationForm from '@/features/locations/NewLocationForm';

export default function NovoLocalPage() {
  return (
    <>
      <PageHeader title="Novo Local" back />
      <div className="p-4">
        <NewLocationForm />
      </div>
    </>
  );
}
