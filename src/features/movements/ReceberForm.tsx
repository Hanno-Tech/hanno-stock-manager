"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { MapPin, ScanLine, Save, TriangleAlert } from "lucide-react";
import { Mono, BarcodeScanner } from "@/components";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KIND_ICON, storedLabel } from "@/features/locations/format";
import type { LocationSummary } from "@/features/locations/queries";
import { receiveItem, suggestPosition, type ReceiveState } from "./actions";
import type { SuggestedPosition } from "./receive";

export default function ReceberForm({
  locations,
}: {
  locations: LocationSummary[];
}) {
  const [state, formAction, saving] = useActionState<ReceiveState, FormData>(
    receiveItem,
    {},
  );
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [code, setCode] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestedPosition | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      setSuggestion(locationId ? await suggestPosition(locationId) : null);
    });
  }, [locationId]);

  if (locations.length === 0) {
    return (
      <div className="rounded-lg bg-card p-6 text-center">
        <p className="font-semibold">Nenhum local com vaga livre</p>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Cadastre um local de guarda antes de receber mercadorias.
        </p>
        <Link href="/app/locais/novo" className={buttonVariants()}>
          Cadastrar local
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error && (
        <p className="flex items-start gap-2 rounded-lg bg-red-100 p-3 text-sm text-red-900">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="trackingCode">Código lido</Label>
        <div className="relative">
          <Input
            id="trackingCode"
            name="trackingCode"
            placeholder="ML-987234-A"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="pr-14 font-mono"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Escanear código"
            onClick={() => setScannerOpen(true)}
            className="absolute top-1/2 right-1 -translate-y-1/2 text-primary"
          >
            <ScanLine className="size-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="locationId">Guardar em</Label>
        <Select
          name="locationId"
          value={locationId}
          onValueChange={(v) => setLocationId(v ?? "")}
        >
          <SelectTrigger id="locationId" className="w-full">
            {/* O valor é o UUID do local; sem este map o gatilho mostraria o id cru. */}
            <SelectValue>
              {(v) => locations.find((l) => l.id === v)?.name ?? 'Escolha um local'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {locations.map((l) => {
              const KindIcon = KIND_ICON[l.kind];
              return (
                <SelectItem key={l.id} value={l.id}>
                  <KindIcon className="size-4" />
                  {l.name}
                  <span className="text-muted-foreground">
                    ({storedLabel(l.stored)})
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Vaga sugerida</span>
        {suggestion ? (
          /* Amarelo sólido com pin, como a tela de ação do Tetris: é o dado que
             o operador olha uma vez e leva na cabeça até a prateleira. */
          <div className="rounded-lg bg-ml-yellow px-4 py-6 text-center text-ml-yellow-on">
            <MapPin className="mx-auto size-10" strokeWidth={1.5} />
            <p className="font-heading mt-2 text-2xl font-bold">
              {suggestion.locationName}
            </p>
            <Mono className="text-3xl font-bold">vaga {suggestion.label}</Mono>
            {suggestion.hint && (
              <p className="mt-2 text-sm font-medium">{suggestion.hint}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
            <MapPin className="size-5 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Este local está cheio. Escolha outro.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="note">Nome do cliente / Obs (opcional)</Label>
        <Textarea id="note" name="note" rows={2} />
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={saving || !suggestion}
        className="w-full"
      >
        <Save />
        {saving ? "Salvando..." : "Salvar Entrada"}
      </Button>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(c) => setCode(c)}
      />
    </form>
  );
}
