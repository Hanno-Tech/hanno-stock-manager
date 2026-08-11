import { Archive, Boxes, DoorClosed, LayoutPanelTop, MapPin, Package } from 'lucide-react';
import type { LocationKind } from '@/db/schema';

/**
 * Ordem de exibição dos tipos. Vive aqui e não em actions.ts porque um módulo
 * 'use server' só pode exportar funções async — constantes quebram em runtime.
 */
export const LOCATION_KINDS = [
  'ESTANTE',
  'CAIXA',
  'PRATELEIRA',
  'PALLET',
  'ARMARIO',
  'OUTRO',
] as const;

export const KIND_LABEL: Record<LocationKind, string> = {
  ESTANTE: 'Estante',
  CAIXA: 'Caixa',
  PRATELEIRA: 'Prateleira',
  PALLET: 'Pallet',
  ARMARIO: 'Armário',
  OUTRO: 'Outro',
};

/**
 * Ícone por tipo. Usamos lucide e não emoji: emoji depende de fonte do sistema
 * e some (vira retângulo vazio) em Android sem fonte de emoji ou em WebView.
 */
export const KIND_ICON: Record<LocationKind, React.ComponentType<{ className?: string }>> = {
  ESTANTE: Boxes,
  CAIXA: Package,
  PRATELEIRA: LayoutPanelTop,
  PALLET: Archive,
  ARMARIO: DoorClosed,
  OUTRO: MapPin,
};

/** "12 mercadorias" / "1 mercadoria" / "vazio". */
export function storedLabel(n: number): string {
  if (n === 0) return 'vazio';
  return n === 1 ? '1 mercadoria' : `${n} mercadorias`;
}
