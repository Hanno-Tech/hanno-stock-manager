export type Size = 'P' | 'M' | 'G';
export type ItemStatus = 'AGUARDANDO_RETIRADA' | 'ENTREGUE';
type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export const SIZE_LABEL: Record<Size, string> = {
  P: 'Pequeno',
  M: 'Médio',
  G: 'Grande',
};

export function statusPill(status: ItemStatus): { label: string; tone: Tone } {
  return status === 'ENTREGUE'
    ? { label: 'Entregue', tone: 'success' }
    : { label: 'Aguardando Retirada', tone: 'warning' };
}

/** Formata data/hora curta em pt-BR (ex.: "12 out, 14:30"). */
export function formatDateTime(d: Date | string): string {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
