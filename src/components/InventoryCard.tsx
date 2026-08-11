import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Mono from './Mono';
import StatusPill from './StatusPill';
import { cn } from '@/lib/utils';

type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

/** Card de mercadoria: código em mono, local/observação abaixo e status. */
export default function InventoryCard({
  sku,
  title,
  subtitle,
  status,
  href,
}: {
  sku: string;
  title: string;
  subtitle?: string;
  status?: { label: string; tone: Tone };
  href?: string;
}) {
  const content = (
    <div className="flex w-full items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <Mono className="block truncate font-bold">{title}</Mono>
        {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
        {status && (
          <div className="mt-2">
            <StatusPill label={status.label} tone={status.tone} />
          </div>
        )}
      </div>
      {sku !== title && (
        <Mono className="shrink-0 text-sm whitespace-nowrap text-muted-foreground">{sku}</Mono>
      )}
      {href && <ChevronRight className="size-5 shrink-0 text-muted-foreground" />}
    </div>
  );

  const base = 'block overflow-hidden rounded-lg bg-card text-card-foreground';

  return href ? (
    <Link
      href={href}
      className={cn(base, 'transition-colors hover:bg-muted/60 active:bg-muted')}
    >
      {content}
    </Link>
  ) : (
    <div className={base}>{content}</div>
  );
}
