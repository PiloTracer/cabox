import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import '@/app/globals.css';
import Providers from '@/components/Providers';
import { ThemeScript } from '@/components/ThemeScript';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Cabox — Moda Curada de Costa Rica', template: '%s | Cabox' },
  description: 'Descubre moda curada con estilo premium para el día a día.',
  keywords: ['fashion', 'clothing', 'curated', 'cabox', 'moda', 'ropa', 'costa rica'],
  manifest: '/manifest.json',
  openGraph: { type: 'website', siteName: 'Cabox', title: 'Cabox — Moda Curada' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8B5E3C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* Dynamic brand color from StoreSettings — overrides CSS defaults */}
        {/* @ts-expect-error — async server component inside JSX */}
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
