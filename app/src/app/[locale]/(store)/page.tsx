import { getTranslations, getLocale } from 'next-intl/server';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/store/ProductCard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cabox — Moda Curada de Costa Rica',
  description: 'Descubre nuestra colección de ropa y accesorios premium, perfecta para el estilo de vida costarricense.',
};

export default async function HomePage() {
  const t = await getTranslations('home');
  const locale = await getLocale();

  // Featured products
  const featured = await prisma.product.findMany({
    where: { status: 'ACTIVE', featured: true },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
    take: 4,
  });

  const fmt = (p: { price: number; currency: string }) =>
    new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: p.currency === 'USD' ? 'USD' : 'CRC',
      maximumFractionDigits: 0,
    }).format(p.price);

  return (
    <>
      {/* Hero */}
      <section className="store-hero">
        <div className="container">
          <div className="store-hero-content animate-fade-in">
            <span className="badge badge-new" style={{ marginBottom: '1rem' }}>Nueva colección</span>
            <h1 className="store-hero-title">{t('welcome')}</h1>
            <p className="store-hero-sub">{t('tagline')}</p>
            <div className="store-hero-actions">
              <Link href={`/${locale}/products`} className="btn btn-primary btn-lg">
                {t('shopNow')}
              </Link>
              <Link href={`/${locale}/products?cat=accesorios`} className="btn btn-secondary btn-lg">
                Accesorios
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category pills */}
      <section className="section" style={{ paddingBlock: '2.5rem' }}>
        <div className="container">
          <div className="category-pills">
            {[
              { slug: 'mujeres', label: '👗 Mujeres' },
              { slug: 'hombres', label: '👔 Hombres' },
              { slug: 'accesorios', label: '👜 Accesorios' },
            ].map((c) => (
              <Link key={c.slug} href={`/${locale}/products?cat=${c.slug}`} className="category-pill">
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2>Productos destacados</h2>
              <Link href={`/${locale}/products`} className="btn btn-secondary btn-sm">
                Ver todos →
              </Link>
            </div>
            <div className="products-grid">
              {featured.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{ ...product, comparePrice: product.comparePrice ? Number(product.comparePrice) : null, price: Number(product.price), images: product.images as string[] }}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Value props */}
      <section className="value-props section">
        <div className="container">
          <div className="value-grid">
            {[
              { icon: '🚚', title: 'Envío gratuito', desc: 'En pedidos mayores a ₡75,000 — GAM' },
              { icon: '✨', title: 'Calidad garantizada', desc: '30 días para devolver si no estás satisfecho' },
              { icon: '💬', title: 'Atención personal', desc: 'Soporte humano por WhatsApp de 8am a 8pm' },
              { icon: '🔒', title: 'Pago seguro', desc: 'Stripe, PayPal y SINPE Móvil' },
            ].map((v) => (
              <div key={v.title} className="value-item">
                <span className="value-icon">{v.icon}</span>
                <div>
                  <h4>{v.title}</h4>
                  <p>{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
