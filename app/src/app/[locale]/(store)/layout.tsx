import { ReactNode } from 'react';
import { getLocale } from 'next-intl/server';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import { CartDrawer } from '@/components/store/CartDrawer';
import { getActiveDepartments } from '@/lib/departments';

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const departments = await getActiveDepartments();

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Cabox',
    url: 'https://www.cabox.app',
    logo: 'https://www.cabox.app/images/logo.png',
    sameAs: [
      'https://www.instagram.com/cabox.cr'
    ]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <Navbar
        locale={locale}
        departments={departments.map((d) => ({
          slug: d.slug,
          nameEs: d.nameEs,
          nameEn: d.nameEn,
        }))}
      />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <Footer locale={locale} />
      <CartDrawer locale={locale} />
    </div>
  );
}
