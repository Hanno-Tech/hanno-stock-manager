import { cn } from '@/lib/utils';

type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

/**
 * Cada tom usa fundo claro + texto escuro da mesma família. Nunca o inverso:
 * os fills de marca do ML (verde/vermelho/amarelo) reprovam AA com texto branco.
 */
const toneClass: Record<Tone, string> = {
  success: 'bg-emerald-100 text-emerald-900',
  warning: 'bg-amber-100 text-amber-900',
  error: 'bg-red-100 text-red-900',
  info: 'bg-blue-100 text-blue-900',
  neutral: 'bg-secondary text-secondary-foreground',
};

/** Pill de status (Aguardando Retirada, Entregue…). */
export default function StatusPill({
  label,
  tone = 'neutral',
  icon,
  className,
}: {
  label: string;
  tone?: Tone;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.6875rem] font-bold tracking-wide',
        toneClass[tone],
        className,
      )}
    >
      {icon}
      {label}
    </span>
  );
}
