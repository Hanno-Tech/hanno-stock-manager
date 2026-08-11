import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { PageHeader, Mono, StatusPill } from '@/components';
import { getItemById } from '@/features/items/queries';
import { requireUser } from '@/features/auth/queries';
import { statusPill, formatDateTime } from '@/features/items/format';
import { KIND_LABEL } from '@/features/locations/format';
import ItemActions from '@/features/items/ItemActions';
import ItemPhoto from '@/features/items/ItemPhoto';

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const item = await getItemById(id, user.id);
  if (!item) notFound();

  const pill = statusPill(item.status);
  const positioned = item.locationName && item.positionLabel;

  return (
    <>
      <PageHeader title="Detalhes do Item" back />
      <div className="flex flex-col gap-4 p-4">
        {/* Cabeçalho: código + status */}
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Código de rastreio</p>
              <Mono className="text-lg font-bold break-all">{item.trackingCode}</Mono>
            </div>
            <StatusPill label={pill.label} tone={pill.tone} className="shrink-0" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {item.status === 'ENTREGUE' ? 'Entregue em' : 'Recebido em'}
            </p>
            <p className="font-semibold">
              {formatDateTime(item.deliveredAt ?? item.receivedAt)}
            </p>
          </div>
        </div>

        {/* Localização — o que o operador precisa ler de longe, andando até a prateleira. */}
        {positioned && (
          <div className="rounded-xl bg-primary p-6 text-center text-primary-foreground">
            <MapPin className="mx-auto size-6" />
            <p className="mt-2 text-[0.6875rem] font-bold tracking-wider uppercase opacity-80">
              {item.locationKind ? KIND_LABEL[item.locationKind] : 'Local'}
            </p>
            <Mono className="text-3xl font-bold">{item.locationName}</Mono>
            <p className="mt-4 text-[0.6875rem] font-bold tracking-wider uppercase opacity-80">
              Vaga exata
            </p>
            <Mono className="text-3xl font-bold">{item.positionLabel}</Mono>
            {item.locationHint && <p className="mt-2 text-sm opacity-90">{item.locationHint}</p>}
          </div>
        )}

        <ItemPhoto itemId={item.id} photoUrl={item.photoUrl} />

        {item.customerNote && (
          <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">Cliente / Observação</p>
            <p>{item.customerNote}</p>
          </div>
        )}

        {item.deliveredTo && (
          <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">Entregue a</p>
            <p className="font-semibold">{item.deliveredTo}</p>
          </div>
        )}

        {item.status === 'AGUARDANDO_RETIRADA' && <ItemActions itemId={item.id} />}
      </div>
    </>
  );
}
