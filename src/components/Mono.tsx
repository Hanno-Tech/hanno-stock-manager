import { cn } from '@/lib/utils';

/**
 * Texto monoespaçado (JetBrains Mono) para códigos de rastreio, vagas e
 * quantidades — evita ambiguidade entre 0/O e 1/l na conferência do pacote.
 */
export default function Mono({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return <span className={cn('font-mono tracking-tight', className)} {...props} />;
}
