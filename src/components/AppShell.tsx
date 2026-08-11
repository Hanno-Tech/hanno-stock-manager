'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, ScanLine, Boxes, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Início', href: '/app', Icon: House },
  { label: 'Receber', href: '/app/receber', Icon: ScanLine },
  { label: 'Locais', href: '/app/locais', Icon: Boxes },
  { label: 'Histórico', href: '/app/historico', Icon: History },
  { label: 'Perfil', href: '/app/perfil', Icon: User },
];

/** Casca da área autenticada: conteúdo rolável + navegação inferior fixa (thumb zone). */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Aba ativa = prefixo mais específico que casa com a rota atual.
  const active = TABS.map((t) => t.href)
    .filter((href) => (href === '/app' ? pathname === '/app' : pathname.startsWith(href)))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto max-w-[480px] pb-[calc(4rem+var(--safe-area-bottom)+1rem)]">
        {children}
      </main>

      <nav className="glass pb-safe fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] border-t">
        <ul className="flex h-16">
          {TABS.map(({ label, href, Icon }) => {
            const isActive = active === href;
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex h-full flex-col items-center justify-center gap-1 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className={cn('size-6', isActive && 'fill-primary/10')} />
                  <span className="text-[0.7rem] font-medium">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
