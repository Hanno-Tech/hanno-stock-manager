import Link from 'next/link';
import { Logo } from '@/components';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { InstagramIcon, TikTokIcon } from './BrandIcons';
import { SOCIAL } from './links';

/**
 * Header da landing: mesma faixa amarela sólida do app (13.7:1 com o quase-preto),
 * fixa no topo. Os links de seção só aparecem no desktop — no celular a barra
 * guarda o essencial: marca, redes e o caminho para entrar.
 */
export default function LandingHeader() {
  return (
    <header className="pt-safe sticky top-0 z-30 bg-ml-yellow text-ml-yellow-on">
      <div className="mx-auto flex min-h-14 max-w-5xl items-center gap-2 px-4">
        <Link href="/sobre" className="flex shrink-0 items-center gap-2">
          <Logo className="size-8" />
          <span className="font-heading text-xl font-bold">Doca</span>
        </Link>

        <nav className="ml-6 hidden flex-1 items-center gap-6 text-sm font-semibold md:flex">
          <a href="#o-que-e" className="hover:underline">
            O que é
          </a>
          <a href="#preco" className="hover:underline">
            Preço
          </a>
          <a href="#historia" className="hover:underline">
            Nossa história
          </a>
          <a href="#startupaberta" className="hover:underline">
            Startup Aberta
          </a>
          <a href="#instalar" className="hover:underline">
            Instalar
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <a
            href={SOCIAL.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok do Startup Aberta"
            className="flex size-11 items-center justify-center rounded-lg transition-colors hover:bg-black/10 active:bg-black/15"
          >
            <TikTokIcon className="size-5" />
          </a>
          <a
            href={SOCIAL.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram do Startup Aberta"
            className="flex size-11 items-center justify-center rounded-lg transition-colors hover:bg-black/10 active:bg-black/15"
          >
            <InstagramIcon className="size-5" />
          </a>
          {/* Azul da marca não passa em AA sobre o amarelo; o quase-preto passa
              com folga e mantém o CTA visível na faixa. */}
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: 'sm' }),
              'ml-1 bg-ml-yellow-on text-white hover:bg-ml-yellow-on/90',
            )}
          >
            Entrar
          </Link>
        </div>
      </div>
    </header>
  );
}
