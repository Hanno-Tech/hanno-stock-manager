'use client';

import { Search, ScanLine } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/** Barra de busca com atalho para a câmera na borda direita. */
export default function SearchBar({
  value,
  onChange,
  onScan,
  placeholder = 'Buscar código...',
}: {
  value?: string;
  onChange?: (value: string) => void;
  onScan?: () => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        inputMode="search"
        className={`h-14 bg-card pl-11 ${onScan ? 'pr-14' : ''}`}
      />
      {onScan && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Escanear código"
          onClick={onScan}
          className="absolute top-1/2 right-1.5 -translate-y-1/2 text-primary"
        >
          <ScanLine className="size-5" />
        </Button>
      )}
    </div>
  );
}
