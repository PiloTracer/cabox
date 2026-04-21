import { getTranslations, getLocale } from 'next-intl/server';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/store/ProductCard';
import { StoreSection, StoreSectionHeader } from '@/components/store/StoreSection';
import type { Metadata } from 'next';
import { getActiveDepartments } from '@/lib/departments';
import { departmentHomePath, productDetailPath } from '@/lib/product-urls';

export const metadata: Metadata = {
  title: 'Cabox — Bien elegido · Costa Rica',
  description:
    'Descubre nuestra colección de ropa y accesorios premium, bien elegidos para el estilo de vida costarricense.',
};

export default async function HomePage() {
  const t = await getTranslations('home');
  const locale = await getLocale();

  const departments = await getActiveDepartments();

  const featured = await prisma.product.findMany({
    where: { status: 'ACTIVE', featured: true },
    include: {
      primaryCategory: true,
      primaryDepartment: true,
      images: { orderBy: { position: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: 4,
  });

  return (
    <>
      {/* Hero */}
      <section className="store-hero">
        <div className="container">
          <div className="store-hero-inner">
            <div className="store-hero-content animate-fade-in">
              <span className="badge badge-new" style={{ marginBottom: '1rem' }}>Nueva colección</span>
              <h1 className="store-hero-title">{t('welcome')}</h1>
              <p className="store-hero-sub">{t('tagline')}</p>
              <div className="store-hero-actions">
                <Link href={`/${locale}/products`} className="btn btn-primary btn-lg">
                  {t('shopNow')}
                </Link>
                {departments[0] && (
                  <Link
                    href={departmentHomePath(locale, departments[0].slug)}
                    className="btn btn-secondary btn-lg"
                  >
                    {locale === 'es' ? departments[0].nameEs : departments[0].nameEn}
                  </Link>
                )}
              </div>
            </div>
            <div className="store-hero-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/cabox_hero_transp.png"
                alt={t('brandTitle')}
                width={480}
                height={480}
              />
            </div>
          </div>
        </div>
      </section>

      {departments.length > 0 && (
        <StoreSection className="section--dense">
          <StoreSectionHeader title={locale === 'es' ? 'Departamentos' : 'Departments'} />
          <div className="category-pills">
            {departments.map((d) => (
              <Link
                key={d.slug}
                href={departmentHomePath(locale, d.slug)}
                className="category-pill"
              >
                {locale === 'es' ? d.nameEs : d.nameEn}
              </Link>
            ))}
          </div>
        </StoreSection>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <StoreSection>
          <StoreSectionHeader
            title={
              locale === 'es' ? 'Productos destacados' : 'Featured products'
            }
            action={
              <Link href={`/${locale}/products`} className="btn btn-secondary btn-sm">
                {locale === 'es' ? 'Ver todos →' : 'View all →'}
              </Link>
            }
          />
          <div className="products-grid">
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  comparePrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
                  price: Number(product.price),
                  images: product.images.map((img) => img.url),
                  category: product.primaryCategory
                    ? {
                        slug: product.primaryCategory.slug,
                        nameEs: product.primaryCategory.nameEs,
                      }
                    : null,
                }}
                locale={locale}
                detailHref={productDetailPath(
                  locale,
                  product.primaryDepartment.slug,
                  product.slug,
                )}
              />
            ))}
          </div>
        </StoreSection>
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
