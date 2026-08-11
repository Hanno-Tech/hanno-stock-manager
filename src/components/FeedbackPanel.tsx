import { Check, TriangleAlert, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'success' | 'warning' | 'error' | 'info';

/**
 * Painel de feedback full-bleed do Tetris: cor sólida ocupando o bloco inteiro,
 * ícone em círculo branco e texto branco. Como o fundo é saturado, o contraste
 * vem do peso da fonte — por isso título em bold e nada de texto fino aqui.
 */
const TONE: Record<Tone, { bg: string; Icon: typeof Check }> = {
  success: { bg: 'bg-ml-success', Icon: Check },
  warning: { bg: 'bg-ml-warning', Icon: TriangleAlert },
  error: { bg: 'bg-ml-danger', Icon: X },
  info: { bg: 'bg-ml-blue', Icon: Info },
};

export default function FeedbackPanel({
  tone = 'info',
  title,
  description,
  action,
  className,
}: {
  tone?: Tone;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  const { bg, Icon } = TONE[tone];

  return (
    <div className={cn('rounded-lg p-6 text-center text-white', bg, className)}>
      <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-white">
        <Icon className={cn('size-6', tone === 'success' && 'text-ml-success', tone === 'warning' && 'text-ml-warning', tone === 'error' && 'text-ml-danger', tone === 'info' && 'text-ml-blue')} />
      </span>
      <p className="mt-3 text-lg font-bold">{title}</p>
      {description && <p className="mt-1 text-sm font-medium">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
