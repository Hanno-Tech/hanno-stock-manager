'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Header sólido amarelo com texto quase-preto — a assinatura do Tetris
 * (biblioteca Andes de operações logísticas). Amarelo + preto dá 13.73:1,
 * o que se lê mesmo sob luz ruim de balcão; amarelo + branco daria 1.27:1.
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
    <header className="pt-safe sticky top-0 z-30 bg-ml-yellow text-ml-yellow-on">
      <div className="flex min-h-14 items-center gap-1 px-2">
        {back && (
          <button
            type="button"
            aria-label="Voltar"
            onClick={() => router.back()}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-black/10 active:bg-black/15"
          >
            <ArrowLeft className="size-6" />
          </button>
        )}
        <h1
          className={cn(
            'font-heading flex-1 truncate text-lg font-bold',
            back ? 'text-center' : 'pl-2 text-left',
          )}
        >
          {title}
        </h1>
        <div className="flex shrink-0 items-center gap-0.5">{actions}</div>
        {/* Compensa a largura do botão voltar para o título ficar mesmo centrado. */}
        {back && !actions && <div aria-hidden className="size-11 shrink-0" />}
      </div>
    </header>
  );
}
