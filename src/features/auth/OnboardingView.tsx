'use client';

import { useState, useTransition } from 'react';
import {
  Plus,
  Trash2,
  TriangleAlert,
  ArrowRight,
  ScanLine,
  Search,
  PackageCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createLocationsBulk } from '@/features/locations/actions';
import { KIND_ICON, KIND_LABEL, LOCATION_KINDS } from '@/features/locations/format';
import { completeOnboardingAction } from './actions';
import type { LocationKind } from '@/db/schema';

type Draft = { key: number; name: string; kind: LocationKind; capacity: number };

/** Sugestões que refletem como uma agência realmente fala do próprio espaço. */
const SUGGESTIONS: { name: string; kind: LocationKind; capacity: number }[] = [
  { name: 'Estante 1', kind: 'ESTANTE', capacity: 12 },
  { name: 'Estante 2', kind: 'ESTANTE', capacity: 12 },
  { name: 'Caixa 1', kind: 'CAIXA', capacity: 8 },
  { name: 'Prateleira A', kind: 'PRATELEIRA', capacity: 10 },
  { name: 'Pallet do fundo', kind: 'PALLET', capacity: 6 },
];

/** O ciclo de vida de um pacote na agência, na ordem em que acontece. */
const STEPS = [
  {
    Icon: ScanLine,
    title: '1. Receba e guarde',
    desc: 'Chegou pacote? Bipe o código da etiqueta. O app diz em qual local e vaga guardar.',
  },
  {
    Icon: Search,
    title: '2. Ache na hora',
    desc: 'Cliente veio retirar? Busque pelo código ou pelo nome e veja exatamente onde o pacote está.',
  },
  {
    Icon: PackageCheck,
    title: '3. Entregue e registre',
    desc: 'Confirme a entrega. A vaga é liberada sozinha e fica o histórico de quem retirou.',
  },
];

export default function OnboardingView({ name }: { name: string }) {
  const [step, setStep] = useState<0 | 1>(0);
  const [drafts, setDrafts] = useState<Draft[]>([
    { key: 1, name: 'Estante 1', kind: 'ESTANTE', capacity: 12 },
  ]);
  const [nextKey, setNextKey] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const update = (key: number, patch: Partial<Draft>) =>
    setDrafts((d) => d.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const add = (preset?: (typeof SUGGESTIONS)[number]) => {
    setDrafts((d) => [
      ...d,
      {
        key: nextKey,
        name: preset?.name ?? '',
        kind: preset?.kind ?? 'ESTANTE',
        capacity: preset?.capacity ?? 12,
      },
    ]);
    setNextKey((k) => k + 1);
  };

  const remove = (key: number) => setDrafts((d) => d.filter((x) => x.key !== key));

  const submit = () => {
    setError(null);
    const filled = drafts.filter((d) => d.name.trim());
    if (filled.length === 0) {
      setError('Cadastre ao menos um local para continuar.');
      return;
    }
    startTransition(async () => {
      const res = await createLocationsBulk({
        locations: filled.map((d) => ({
          name: d.name.trim(),
          kind: d.kind,
          capacity: d.capacity,
        })),
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      await completeOnboardingAction();
    });
  };

  // Só oferece sugestões que ainda não estão na lista.
  const used = new Set(drafts.map((d) => d.name.trim().toLowerCase()));
  const available = SUGGESTIONS.filter((s) => !used.has(s.name.toLowerCase()));

  return (
    <div className="py-4">
      <div className="mb-6 inline-flex items-center rounded-lg bg-ml-yellow px-4 py-2">
        <span className="font-heading text-lg font-bold text-ml-yellow-on">
          Bem-vindo, {name.split(' ')[0]}!
        </span>
      </div>

      <div className="mb-6 flex gap-2" aria-hidden>
        {[0, 1].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-ml-blue' : 'bg-muted'}`}
          />
        ))}
      </div>

      {step === 0 ? (
        <>
          <h1 className="font-heading text-2xl font-bold">Como funciona</h1>
          <p className="mt-2 mb-6 text-muted-foreground">
            Três passos, do pacote chegando até o cliente levando.
          </p>

          <ul className="flex flex-col gap-3">
            {STEPS.map(({ Icon, title, desc }) => (
              <li key={title} className="flex gap-3 rounded-lg bg-card p-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ml-blue-soft">
                  <Icon className="size-5 text-ml-blue-strong" />
                </span>
                <div>
                  <p className="font-bold">{title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <Button size="lg" onClick={() => setStep(1)} className="mt-8 w-full">
            Entendi, vamos configurar
            <ArrowRight />
          </Button>
        </>
      ) : (
        <>
          <h1 className="font-heading text-2xl font-bold">Onde você guarda as mercadorias?</h1>
          <p className="mt-2 mb-6 text-muted-foreground">
            Dê nomes aos seus espaços do jeito que você já fala no dia a dia. Dá para mudar depois.
          </p>

          {error && (
            <p className="mb-4 flex items-start gap-2 rounded-lg bg-red-100 p-3 text-sm text-red-900">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          )}

          <ul className="flex flex-col gap-4">
            {drafts.map((d, i) => (
              <li key={d.key} className="rounded-lg bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[0.6875rem] font-bold tracking-wider text-muted-foreground uppercase">
                    Local {i + 1}
                  </span>
                  {drafts.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remover local ${i + 1}`}
                      onClick={() => remove(d.key)}
                      className="text-muted-foreground"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>

                <div className="mt-2 flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`name-${d.key}`}>Nome</Label>
                    <Input
                      id={`name-${d.key}`}
                      value={d.name}
                      onChange={(e) => update(d.key, { name: e.target.value })}
                      placeholder="Ex.: Estante 1"
                    />
                  </div>

                  <div className="flex gap-3">
                    <div className="flex flex-1 flex-col gap-2">
                      <Label htmlFor={`kind-${d.key}`}>Tipo</Label>
                      <Select
                        value={d.kind}
                        onValueChange={(v) => update(d.key, { kind: v as LocationKind })}
                      >
                        <SelectTrigger id={`kind-${d.key}`} className="w-full">
                          <SelectValue>{(v) => KIND_LABEL[v as LocationKind]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {LOCATION_KINDS.map((k) => {
                            const KindIcon = KIND_ICON[k];
                            return (
                              <SelectItem key={k} value={k}>
                                <KindIcon className="size-4" />
                                {KIND_LABEL[k]}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex w-28 flex-col gap-2">
                      <Label htmlFor={`cap-${d.key}`}>Cabem</Label>
                      <Input
                        id={`cap-${d.key}`}
                        type="number"
                        min={1}
                        max={500}
                        inputMode="numeric"
                        value={d.capacity}
                        onChange={(e) => update(d.key, { capacity: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Button variant="outline" onClick={() => add()} className="mt-4 w-full">
            <Plus />
            Adicionar outro local
          </Button>

          {available.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm text-muted-foreground">Sugestões rápidas:</p>
              <div className="flex flex-wrap gap-2">
                {available.map((s) => (
                  <Button key={s.name} variant="secondary" size="sm" onClick={() => add(s)}>
                    <Plus />
                    {s.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button size="lg" onClick={submit} disabled={pending} className="mt-8 w-full">
            {pending ? 'Criando...' : 'Começar'}
            {!pending && <ArrowRight />}
          </Button>
          <Button variant="ghost" onClick={() => setStep(0)} className="mt-2 w-full">
            Voltar
          </Button>
        </>
      )}
    </div>
  );
}
