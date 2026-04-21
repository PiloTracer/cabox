import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import '@/app/globals.css';
import Providers from '@/components/Providers';
import { ThemeScript } from '@/components/ThemeScript';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Cabox — Bien elegido · Costa Rica', template: '%s | Cabox' },
  description:
    'Descubre piezas bien elegidas con estilo premium para el día a día.',
  keywords: ['fashion', 'clothing', 'cabox', 'moda', 'ropa', 'costa rica', 'bien elegido'],
  manifest: '/manifest.json',
  openGraph: { type: 'website', siteName: 'Cabox', title: 'Cabox — Bien elegido' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8B5E3C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {/* Dynamic brand color from StoreSettings — overrides CSS defaults */}
        <ThemeScript />
      </head>
      <body className={`${inter.variable} ${playfair.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
