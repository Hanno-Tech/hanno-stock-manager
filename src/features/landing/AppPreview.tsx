import { ScanLine, Search, ChevronRight } from 'lucide-react';
import { Logo, Mono } from '@/components';

const LOCAIS = [
  { nome: 'Estante 1', itens: 12 },
  { nome: 'Caixa 2', itens: 5 },
  { nome: 'Balcão', itens: 3 },
];

/**
 * Maquete estática da tela inicial do app — não é um print, é a própria UI
 * remontada com os mesmos tokens, então ela acompanha o tema (inclusive escuro)
 * e não desatualiza como uma imagem.
 */
export default function AppPreview() {
  return (
    <div
      aria-label="Prévia da tela inicial do Doca"
      role="img"
      className="mx-auto w-full max-w-[280px] overflow-hidden rounded-[2rem] bg-background p-2 ring-8 ring-foreground/10"
    >
      <div className="overflow-hidden rounded-[1.5rem] bg-background">
        <div className="bg-ml-yellow px-4 pt-4 pb-5 text-ml-yellow-on">
          <div className="flex items-center gap-2">
            <Logo className="size-6" />
            <span className="font-heading text-base font-bold">Doca</span>
          </div>
          <div className="mt-4 flex gap-6">
            <div>
              <Mono className="block text-3xl leading-none font-bold">20</Mono>
              <p className="mt-1 text-xs font-semibold">Em estoque</p>
            </div>
            <div>
              <Mono className="block text-3xl leading-none font-bold">7</Mono>
              <p className="mt-1 text-xs font-semibold">Recebidos hoje</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-3">
          <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-xs text-muted-foreground ring-1 ring-foreground/10">
            <Search className="size-4" />
            Buscar por nome ou código
          </div>

          <div className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            <ScanLine className="size-4" />
            Receber Mercadoria
          </div>

          <div className="flex flex-col gap-2">
            {LOCAIS.map((local) => (
              <div
                key={local.nome}
                className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-xs ring-1 ring-foreground/10"
              >
                <span className="flex-1 font-semibold">{local.nome}</span>
                <Mono className="text-muted-foreground">{local.itens}</Mono>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
