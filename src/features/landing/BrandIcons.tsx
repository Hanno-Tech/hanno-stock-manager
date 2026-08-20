/**
 * Ícones de marca das redes do @startupaberta.
 *
 * O lucide-react tirou os glifos de marca do pacote (questão de licença), então
 * Instagram e TikTok vivem aqui — desenhados no mesmo grid 24×24 e com o mesmo
 * `currentColor` dos demais ícones, para cair no lugar sem ajuste de tamanho.
 */
type IconProps = { className?: string };

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TikTokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-1.85-2.48V9.66a5.7 5.7 0 1 0 4.94 5.64V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.35 4.35 0 0 1-3.24-1.48Z" />
    </svg>
  );
}
