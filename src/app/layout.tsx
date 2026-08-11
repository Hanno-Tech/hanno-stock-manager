import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/jetbrains-mono';
import './globals.css';
import Providers from './providers';
import ServiceWorker from '@/components/ServiceWorker';
export const metadata: Metadata = {
  title: 'Doca App',
  description: 'Gestão de mercadorias para agências de retirada — mobile-first.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Doca App' },
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
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
        <ServiceWorker />
      </body>
    </html>
  );
}
