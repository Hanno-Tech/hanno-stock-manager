import { cn } from '@/lib/utils';

/**
 * Marca do Doca App — o caminhão parado na doca.
 *
 * Usa `currentColor` e recorta os vazados com uma máscara, em vez de pintá-los
 * da cor do fundo: assim a marca funciona sobre o header amarelo, sobre branco
 * ou sobre foto, sem precisar de uma variante por superfície.
 */
export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      role="img"
      aria-label="Doca"
      className={cn('size-7', className)}
      fill="currentColor"
    >
      <mask id="doca-cutouts">
        <rect width="512" height="512" fill="white" />
        <circle cx="164" cy="354" r="17" fill="black" />
        <circle cx="392" cy="354" r="17" fill="black" />
        <rect x="108" y="170" width="150" height="128" rx="12" fill="black" />
      </mask>

      <g mask="url(#doca-cutouts)">
        <rect x="58" y="398" width="396" height="20" rx="10" />
        <rect x="76" y="138" width="214" height="192" rx="20" />
        <path d="M290 198h92c8 0 15 3 20 9l38 46c5 6 8 13 8 21v56H290V198z" />
        <circle cx="164" cy="354" r="44" />
        <circle cx="392" cy="354" r="44" />
      </g>

      {/* Seta de saída: a mercadoria deixando a doca. */}
      <path
        d="M148 234h62m0 0-24-24m24 24-24 24"
        stroke="currentColor"
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
