'use client';

import { useState } from 'react';
import { EllipsisVertical, Share, Plus, Check, Smartphone } from 'lucide-react';
import { Mono } from '@/components';
import { cn } from '@/lib/utils';

type Platform = 'android' | 'ios';

type Step = { text: React.ReactNode; hint?: string };

const STEPS: Record<Platform, { label: string; intro: string; steps: Step[] }> = {
  android: {
    label: 'Android',
    intro: 'No Chrome (ou Edge/Samsung Internet), leva menos de um minuto.',
    steps: [
      {
        text: (
          <>
            Abra <strong>esta página</strong> no Chrome do seu Android.
          </>
        ),
        hint: 'Se você chegou aqui por um link do Instagram ou do TikTok, toque no menu do app e escolha “Abrir no navegador”.',
      },
      {
        text: (
          <>
            Toque no menu <EllipsisVertical className="inline size-4 align-text-bottom" /> (três
            pontinhos) no canto superior direito.
          </>
        ),
      },
      {
        text: (
          <>
            Escolha <strong>“Instalar aplicativo”</strong> — em alguns aparelhos aparece como{' '}
            <strong>“Adicionar à tela inicial”</strong>.
          </>
        ),
        hint: 'Está dentro de “Adicionar a…” em algumas versões do Chrome.',
      },
      {
        text: (
          <>
            Confirme o nome <strong>Doca App</strong> e toque em <strong>Instalar</strong>.
          </>
        ),
      },
      {
        text: (
          <>
            Pronto: o ícone aparece na tela inicial. Abra por ele e entre com sua conta — o app
            roda em tela cheia, sem a barra do navegador.
          </>
        ),
      },
    ],
  },
  ios: {
    label: 'iPhone e iPad',
    intro: 'No iPhone o atalho só é criado pelo Safari — o Chrome do iOS não oferece a opção.',
    steps: [
      {
        text: (
          <>
            Abra <strong>esta página no Safari</strong>.
          </>
        ),
        hint: 'Veio de um link do Instagram/TikTok? Toque em “Abrir no Safari” no menu do app.',
      },
      {
        text: (
          <>
            Toque no botão <strong>Compartilhar</strong>{' '}
            <Share className="inline size-4 align-text-bottom" /> (o quadrado com a seta para
            cima), na barra de baixo.
          </>
        ),
        hint: 'No iPad ele fica na barra de cima, ao lado do endereço.',
      },
      {
        text: (
          <>
            Role a lista e toque em <strong>“Adicionar à Tela de Início”</strong>{' '}
            <Plus className="inline size-4 align-text-bottom" />.
          </>
        ),
      },
      {
        text: (
          <>
            Ajuste o nome para <strong>Doca</strong> e toque em <strong>Adicionar</strong>, no
            canto superior direito.
          </>
        ),
      },
      {
        text: (
          <>
            Pronto: o ícone aparece na tela de início e o Doca abre em tela cheia, como um app
            normal.
          </>
        ),
      },
    ],
  },
};

/**
 * Passo a passo de instalação. Como o Doca é um PWA, o caminho muda por
 * plataforma — e mostrar os dois de uma vez faria a seção esticar demais no
 * celular, então um controle segmentado alterna entre eles.
 */
export default function InstallGuide() {
  const [platform, setPlatform] = useState<Platform>('android');
  const current = STEPS[platform];

  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:p-6">
      <div
        role="tablist"
        aria-label="Sistema do celular"
        className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
      >
        {(Object.keys(STEPS) as Platform[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`tab-${key}`}
            aria-selected={platform === key}
            aria-controls={`painel-${key}`}
            onClick={() => setPlatform(key)}
            className={cn(
              'touch-target rounded-md px-3 text-sm font-bold transition-colors',
              platform === key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {STEPS[key].label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`painel-${platform}`} aria-labelledby={`tab-${platform}`}>
        <p className="mb-5 flex items-start gap-2 text-sm text-muted-foreground">
          <Smartphone className="mt-0.5 size-4 shrink-0" />
          {current.intro}
        </p>

        <ol className="flex flex-col gap-4">
          {current.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ml-yellow text-ml-yellow-on"
              >
                {i === current.steps.length - 1 ? (
                  <Check className="size-4" />
                ) : (
                  <Mono className="text-sm font-bold">{i + 1}</Mono>
                )}
              </span>
              <div className="pt-1">
                <p className="text-[0.95rem] leading-snug">{step.text}</p>
                {step.hint && (
                  <p className="mt-1 text-sm text-muted-foreground">{step.hint}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-6 rounded-lg bg-accent p-3 text-sm text-accent-foreground">
        Não precisa baixar nada da Play Store nem da App Store: o Doca é um app web, instala
        direto do navegador e atualiza sozinho.
      </p>
    </div>
  );
}
