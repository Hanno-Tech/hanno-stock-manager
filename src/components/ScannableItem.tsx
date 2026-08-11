import Link from 'next/link';
import { ScanLine } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Padrão "scannable item" do Tetris: rótulo pequeno em cima, o dado bipável em
 * tipografia pesada embaixo, colchetes de scan à esquerda. É o card que o
 * operador lê de relance enquanto anda até a prateleira.
 */
export default function ScannableItem({
  label,
  value,
  meta,
  badge,
  href,
  className,
}: {
  label?: string;
  value: string;
  meta?: string;
  badge?: React.ReactNode;
  href?: string;
  className?: string;
}) {
  const content = (
    <div className="flex w-full items-center gap-3 p-4">
      <ScanLine aria-hidden className="size-6 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        {label && (
          <p className="text-[0.6875rem] font-bold tracking-wider text-muted-foreground uppercase">
            {label}
          </p>
        )}
        <p className="truncate font-mono text-lg font-bold tracking-tight">{value}</p>
        {meta && <p className="truncate text-sm text-muted-foreground">{meta}</p>}
      </div>
      {badge}
    </div>
  );

  const base = cn('block overflow-hidden rounded-lg bg-card text-card-foreground', className);

  return href ? (
    <Link href={href} className={cn(base, 'transition-colors hover:bg-muted/60 active:bg-muted')}>
      {content}
    </Link>
  ) : (
    <div className={base}>{content}</div>
  );
}
