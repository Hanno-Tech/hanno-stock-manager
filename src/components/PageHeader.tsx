'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Cabeçalho fixo da página. Usa `.glass` — é um dos dois únicos lugares do app
 * com backdrop-filter (o outro é a bottom nav), justamente por ser pequeno,
 * fixo e não rolar: o blur é recalculado a cada frame e custa caro em celular.
 */
export default function PageHeader({
  title,
  back = false,
  actions,
}: {
  title: string;
  back?: boolean;
  actions?: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <header className="glass pt-safe sticky top-0 z-30 border-b">
      <div className="flex min-h-14 items-center gap-1 px-2">
        {back && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Voltar"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft />
          </Button>
        )}
        <h1
          className={cn(
            'font-heading flex-1 truncate text-lg font-bold text-primary',
            back ? 'text-center' : 'pl-2 text-left',
          )}
        >
          {title}
        </h1>
        <div className="flex shrink-0 items-center gap-0.5">{actions}</div>
        {/* Compensa a largura do botão voltar para o título ficar realmente centrado. */}
        {back && !actions && <div aria-hidden className="size-11 shrink-0" />}
      </div>
    </header>
  );
}
