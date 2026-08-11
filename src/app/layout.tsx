import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/jetbrains-mono';
import './globals.css';
import Providers from './providers';
import ServiceWorker from '@/components/ServiceWorker';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Estoque Rápido',
  description: 'Gestão de estoque de galpão — rápida e mobile-first.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Estoque Rápido' },
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // habilita env(safe-area-inset-*) em aparelhos com notch
  themeColor: '#ffe600', // amarelo Mercado Livre na barra do sistema
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={cn("font-sans", geist.variable)}>
      <body>
        <Providers>{children}</Providers>
        <ServiceWorker />
      </body>
    </html>
  );
}
