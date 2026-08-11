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
      <div className="flex flex-col gap-3 p-4">
        {/* Cabeçalho: código + status */}
        <div className="rounded-lg bg-card p-4">
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

        {/* Onde o pacote está. Tela-ação do Tetris: amarelo sólido, pin grande e
            tipografia pesada — o operador lê isso andando até a prateleira. */}
        {positioned && (
          <div className="-mx-4 bg-ml-yellow px-4 py-8 text-center text-ml-yellow-on">
            <MapPin className="mx-auto size-12" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-semibold">
              {item.locationKind ? KIND_LABEL[item.locationKind] : 'Local'}
            </p>
            <p className="font-heading text-4xl font-bold">{item.locationName}</p>
            <p className="mt-4 text-sm font-semibold">Vaga</p>
            <Mono className="text-4xl font-bold">{item.positionLabel}</Mono>
            {item.locationHint && (
              <p className="mt-3 text-sm font-medium">{item.locationHint}</p>
            )}
          </div>
        )}

        <ItemPhoto itemId={item.id} photoUrl={item.photoUrl} />

        {item.customerNote && (
          <div className="rounded-lg bg-card p-4">
            <p className="text-sm text-muted-foreground">Cliente / Observação</p>
            <p>{item.customerNote}</p>
          </div>
        )}

        {item.deliveredTo && (
          <div className="rounded-lg bg-card p-4">
            <p className="text-sm text-muted-foreground">Entregue a</p>
            <p className="font-semibold">{item.deliveredTo}</p>
          </div>
        )}

        {item.status === 'AGUARDANDO_RETIRADA' && <ItemActions itemId={item.id} />}
      </div>
    </>
  );
}
