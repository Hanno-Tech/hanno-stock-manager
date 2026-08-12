import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Marca do Doca App.
 *
 * O caminhão é amarelo, e o header do app também — então a marca carrega o
 * próprio fundo preto num badge arredondado, em vez de tentar se virar sobre
 * a superfície. É o mesmo recorte que vira o ícone do PWA (scripts/gen-icons.mjs).
 */
export default function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-mark.png"
      alt="Doca"
      width={512}
      height={512}
      priority
      className={cn('size-8 rounded-lg object-cover', className)}
    />
  );
}
