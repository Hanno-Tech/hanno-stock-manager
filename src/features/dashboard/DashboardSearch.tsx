'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchBar, BarcodeScanner } from '@/components';

/** Busca do dashboard: envia para os resultados por Enter, scan ou toque no ícone. */
export default function DashboardSearch() {
  const [q, setQ] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const router = useRouter();

  const go = (term: string) => {
    const t = term.trim();
    router.push(t ? `/app/buscar?q=${encodeURIComponent(t)}` : '/app/buscar');
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go(q);
      }}
    >
      <SearchBar value={q} onChange={setQ} onScan={() => setScannerOpen(true)} />
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(scan) => {
          // Vale tanto para o id do QR da etiqueta quanto para o phrase do QR
          // que o cliente apresenta na retirada.
          setQ(scan.value);
          go(scan.value);
        }}
      />
    </form>
  );
}
