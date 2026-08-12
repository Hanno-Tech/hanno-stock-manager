/**
 * Normaliza o que a câmera devolve.
 *
 * O leitor entrega três coisas diferentes conforme o que foi bipado:
 *
 *  - Código de barras da etiqueta → string crua ("ML-987234-A"). Já funciona.
 *  - QR da etiqueta → JSON com `id` e outras props. Só o `id` interessa.
 *  - QR do cliente na retirada → `{"phrase":"UNIVERSO.796520","extraData":null}`.
 *    O `phrase` é o código de retirada usado no sistema interno do Mercado Livre.
 *
 * O resto do app trabalha com o valor normalizado; o `raw` fica para depuração
 * e para o operador conferir o que a câmera realmente leu.
 */
export type ScanKind = 'ID' | 'PHRASE' | 'RAW';

export type ParsedScan = {
  kind: ScanKind;
  /** O que deve ser usado como código: o id, o phrase, ou a string crua. */
  value: string;
  raw: string;
};

/** Aceita number para não perder ids numéricos, mas rejeita objeto/array. */
function scalar(v: unknown): string | null {
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return null;
}

export function parseScan(raw: string): ParsedScan {
  const text = raw.trim();
  if (!text) return { kind: 'RAW', value: '', raw };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Caso mais comum: código de barras puro.
    return { kind: 'RAW', value: text, raw };
  }

  // `JSON.parse("796520")` devolve number — um código de barras numérico não
  // pode ser confundido com payload estruturado.
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { kind: 'RAW', value: text, raw };
  }

  const obj = parsed as Record<string, unknown>;

  // `id` antes de `phrase`: o QR da etiqueta traz id, o do cliente traz phrase.
  const id = scalar(obj.id);
  if (id) return { kind: 'ID', value: id, raw };

  const phrase = scalar(obj.phrase);
  if (phrase) return { kind: 'PHRASE', value: phrase, raw };

  // JSON que não reconhecemos: devolve cru em vez de engolir o conteúdo.
  return { kind: 'RAW', value: text, raw };
}
