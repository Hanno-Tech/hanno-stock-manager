'use client';

import { useActionState } from 'react';
import { TriangleAlert } from 'lucide-react';
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
import { createLocation, type LocationFormState } from './actions';
import { KIND_ICON, KIND_LABEL, LOCATION_KINDS } from './format';
import type { LocationKind } from '@/db/schema';

export default function NewLocationForm() {
  const [state, formAction, pending] = useActionState<LocationFormState, FormData>(
    createLocation,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && (
        <p className="flex items-start gap-2 rounded-lg bg-red-100 p-3 text-sm text-red-900">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome do local</Label>
        <Input id="name" name="name" placeholder="Ex.: Estante 1, Caixa 2" required autoFocus />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="kind">Tipo</Label>
        <Select name="kind" defaultValue="ESTANTE">
          <SelectTrigger id="kind" className="w-full">
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="hint">Onde fica (opcional)</Label>
        <Input id="hint" name="hint" placeholder="Ex.: atrás do balcão" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="capacity">Quantas mercadorias cabem</Label>
        <Input
          id="capacity"
          name="capacity"
          type="number"
          defaultValue={12}
          min={1}
          max={500}
          inputMode="numeric"
          required
        />
      </div>

      <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
        {pending ? 'Salvando...' : 'Salvar local'}
      </Button>
    </form>
  );
}
