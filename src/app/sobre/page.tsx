import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ScanLine,
  MapPin,
  Search,
  Camera,
  Clock,
  QrCode,
  Store,
  ArrowRight,
  Radio,
  Check,
} from 'lucide-react';
import { Logo, Mono } from '@/components';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AppPreview from '@/features/landing/AppPreview';
import InstallGuide from '@/features/landing/InstallGuide';
import LandingHeader from '@/features/landing/LandingHeader';
import { InstagramIcon, TikTokIcon } from '@/features/landing/BrandIcons';
import { HANDLE, SOCIAL } from '@/features/landing/links';

export const metadata: Metadata = {
  title: 'Doca — o estoque da sua agência de retirada, organizado',
  description:
    'App mobile-first para agências de retirada do Mercado Livre: recebe o pacote, guarda num local nomeado e acha na hora em que o cliente chega. R$ 19,90 por mês. Feito em público no ' +
    HANDLE +
    '.',
};

const RECURSOS = [
  {
    Icon: ScanLine,
    titulo: 'Receber em segundos',
    texto:
      'Escaneia o QR do pacote pela câmera do celular, escolhe o local e pronto. Sem digitar código de rastreio.',
  },
  {
    Icon: MapPin,
    titulo: 'Locais com nome de gente',
    texto:
      '“Estante 1”, “Caixa 2”, “Balcão”. Você cria os locais do seu jeito e vê quantos pacotes tem em cada um.',
  },
  {
    Icon: Search,
    titulo: 'Achar na hora',
    texto:
      'O cliente chega e você busca pelo nome dele ou pelo código. O app diz exatamente em que local o pacote está.',
  },
  {
    Icon: Camera,
    titulo: 'Foto do pacote',
    texto:
      'Uma foto no recebimento evita discussão depois: dá para conferir a embalagem do jeito que ela chegou.',
  },
  {
    Icon: QrCode,
    titulo: 'Retirada registrada',
    texto:
      'Na entrega, o nome de quem retirou fica gravado junto com a data. Nada de caderno e caneta.',
  },
  {
    Icon: Clock,
    titulo: 'Histórico do dia',
    texto:
      'Quantos entraram, quantos saíram e o que ainda está parado na sua agência — sempre à mão.',
  },
];

const INCLUSO = [
  'Recebimento pelo QR do pacote, direto da câmera',
  'Locais criados por você — estante, caixa, balcão',
  'Busca pelo nome do cliente ou pelo código',
  'Foto do pacote no recebimento',
  'Registro de quem retirou, com data',
  'Histórico do movimento da agência',
  'App instalável no celular, sem loja de apps',
  'Atualizações incluídas, sem custo extra',
];

export default function SobrePage() {
  return (
    <div className="min-h-dvh">
      <LandingHeader />

      {/* A faixa amarela continua o header, igual à tela inicial do app. */}
      <section className="bg-ml-yellow text-ml-yellow-on">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 md:grid-cols-2 md:items-center md:py-16">
          <div>
            <p className="text-sm font-bold tracking-wide uppercase opacity-80">
              Para agências de retirada do Mercado Livre
            </p>
            <h1 className="font-heading mt-3 text-3xl leading-tight font-bold sm:text-4xl md:text-5xl">
              O pacote entrou.
              <br />
              Você sabe onde ele está.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed sm:text-lg">
              O Doca recebe a mercadoria, guarda num local com nome e devolve o pacote na hora em
              que o cliente aparece no balcão. Tudo pelo celular.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'w-full bg-ml-yellow-on text-white hover:bg-ml-yellow-on/90 sm:w-auto',
                )}
              >
                Entrar no app
                <ArrowRight />
              </Link>
              <a
                href="#instalar"
                className={cn(
                  buttonVariants({ size: 'lg', variant: 'outline' }),
                  'w-full border-ml-yellow-on/35 bg-ml-yellow-on/5 text-ml-yellow-on hover:bg-black/10 sm:w-auto',
                )}
              >
                Instalar no celular
              </a>
            </div>

            <p className="mt-4 text-sm font-semibold">
              <Mono className="font-bold">R$ 19,90</Mono> por mês ·{' '}
              <a href="#preco" className="underline underline-offset-2">
                veja o que vem junto
              </a>
            </p>
          </div>

          <AppPreview />
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        <section id="o-que-e" className="scroll-mt-20">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">O que é o Doca</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Um app web mobile-first para quem guarda pacote dos outros. Ele troca a pilha no canto
            da loja e a planilha improvisada por um fluxo curto: recebeu, guardou, achou, entregou.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RECURSOS.map(({ Icon, titulo, texto }) => (
              <div key={titulo} className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
                <span className="flex size-11 items-center justify-center rounded-lg bg-ml-blue-soft text-ml-blue-strong">
                  <Icon className="size-5" />
                </span>
                <h3 className="font-heading mt-4 text-base font-bold">{titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{texto}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="preco" className="mt-16 scroll-mt-20 md:mt-24">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">Quanto custa</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Um plano só, com tudo dentro — sem taxa de instalação e sem cobrança por pacote
            recebido.
          </p>

          <div className="mt-8 overflow-hidden rounded-xl ring-1 ring-foreground/10 md:grid md:grid-cols-[1fr_1.2fr]">
            {/* O preço é o dado que a pessoa veio conferir: amarelo sólido e
                número em mono pesado, do mesmo jeito que o app trata contagem. */}
            <div className="flex flex-col justify-center bg-ml-yellow p-6 text-ml-yellow-on sm:p-8">
              <p className="text-sm font-bold tracking-wide uppercase opacity-80">Plano único</p>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="text-xl font-bold">R$</span>
                {/* A vírgula do JetBrains Mono ocupa a mesma caixa dos dígitos e
                    abre um vão no meio do preço; o tracking negativo fecha isso. */}
                <Mono className="text-5xl leading-none font-bold tracking-[-0.06em]">19,90</Mono>
                <span className="text-base font-semibold">/mês</span>
              </p>
              <p className="mt-3 text-sm font-medium">
                Por agência, com todos os recursos liberados.
              </p>
              <Link
                href="/cadastro"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'mt-6 w-full bg-ml-yellow-on text-white hover:bg-ml-yellow-on/90',
                )}
              >
                Criar conta
                <ArrowRight />
              </Link>
            </div>

            <div className="bg-card p-6 sm:p-8">
              <p className="font-heading text-base font-bold">O que está incluído</p>
              <ul className="mt-4 flex flex-col gap-3">
                {INCLUSO.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-ml-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="historia" className="mt-16 scroll-mt-20 md:mt-24">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">Por que criamos</h2>

          <div className="mt-6 grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-start">
            <div className="flex flex-col gap-4 text-base leading-relaxed">
              <p>
                Tudo começou dentro de uma loja de verdade: a{' '}
                <strong>Angels Papers, em Joinville</strong>. Além de vender, ela é ponto de
                retirada do Mercado Livre — e a papelada de todo dia virou pacote empilhado por
                todo canto.
              </p>
              <p>
                A pergunta que travava o balcão era sempre a mesma:{' '}
                <em>“onde é que a gente guardou esse aqui?”</em>. Cliente esperando, alguém
                vasculhando prateleira, caderninho que ninguém achava. Fizemos o Doca primeiro para
                resolver isso — organizar as mercadorias do Meli da Angels Papers.
              </p>
              <p>
                Funcionou. E ficou claro que o problema não era só dela: toda agência de retirada
                vive o mesmo aperto, com o mesmo caderno e a mesma pilha. Daí a decisão de tirar o
                app de dentro de uma loja só e deixá-lo pronto para as outras.
              </p>
            </div>

            <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <span className="flex size-11 items-center justify-center rounded-lg bg-ml-yellow text-ml-yellow-on">
                <Store className="size-5" />
              </span>
              <p className="font-heading mt-4 text-base font-bold">Angels Papers</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Joinville, Santa Catarina — papelaria e ponto de retirada do Mercado Livre. Foi o
                balcão onde o Doca foi testado antes de existir como produto.
              </p>
            </div>
          </div>
        </section>

        <section id="startupaberta" className="mt-16 scroll-mt-20 md:mt-24">
          <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10 sm:p-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-ml-blue-soft px-3 py-1 text-sm font-bold text-ml-blue-strong">
              <Radio className="size-4" />
              Construído em público
            </span>
            <h2 className="font-heading mt-4 text-2xl font-bold sm:text-3xl">
              A gente registra tudo no {HANDLE}
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              O Startup Aberta é o canal onde mostramos a construção do Doca por dentro: as
              decisões, o que deu errado, o que mudou depois de conversar com quem está no balcão.
              Se quiser acompanhar — ou palpitar no que vem a seguir — é por lá.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href={SOCIAL.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg bg-muted p-4 transition-colors hover:bg-ml-blue-soft"
              >
                <TikTokIcon className="size-6 shrink-0" />
                <span className="flex-1">
                  <span className="block font-bold">TikTok</span>
                  <span className="block text-sm text-muted-foreground">{HANDLE}</span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </a>
              <a
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg bg-muted p-4 transition-colors hover:bg-ml-blue-soft"
              >
                <InstagramIcon className="size-6 shrink-0" />
                <span className="flex-1">
                  <span className="block font-bold">Instagram</span>
                  <span className="block text-sm text-muted-foreground">{HANDLE}</span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </a>
            </div>
          </div>
        </section>

        <section id="instalar" className="mt-16 scroll-mt-20 md:mt-24">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">Instalar no celular</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            O Doca abre no navegador, mas fica bem melhor com o ícone na tela inicial: abre em
            tela cheia, sem barra de endereço, e a câmera do scanner responde na hora.
          </p>

          <div className="mt-8 max-w-2xl">
            <InstallGuide />
          </div>
        </section>

        <section className="mt-16 rounded-xl bg-ml-yellow p-6 text-ml-yellow-on sm:p-8 md:mt-24">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">
            Sua agência, sem pacote perdido
          </h2>
          <p className="mt-2 max-w-xl">
            Crie sua conta, cadastre os locais da sua loja e comece a receber hoje mesmo. R$ 19,90 por mês.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/cadastro"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'w-full bg-ml-yellow-on text-white hover:bg-ml-yellow-on/90 sm:w-auto',
              )}
            >
              Criar conta
              <ArrowRight />
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: 'lg', variant: 'outline' }),
                'w-full border-ml-yellow-on/35 bg-ml-yellow-on/5 text-ml-yellow-on hover:bg-black/10 sm:w-auto',
              )}
            >
              Já tenho conta
            </Link>
          </div>
        </section>
      </main>

      <footer className="pb-safe border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Logo className="size-7" />
            <span className="font-heading font-bold">Doca</span>
            <span className="text-sm text-muted-foreground">
              · feito em público no {HANDLE}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a
              href={SOCIAL.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <TikTokIcon className="size-4" />
              TikTok
            </a>
            <a
              href={SOCIAL.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <InstagramIcon className="size-4" />
              Instagram
            </a>
            <Link href="/login" className="font-bold text-ml-blue-strong hover:underline">
              Entrar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
