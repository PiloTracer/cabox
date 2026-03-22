import { ReactNode } from 'react';
import { getLocale } from 'next-intl/server';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar locale={locale} />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
