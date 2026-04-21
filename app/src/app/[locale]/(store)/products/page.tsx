import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/store/ProductCard';
import { PageHero } from '@/components/store/PageHero';
import { StoreMain } from '@/components/store/StoreSection';
import { getLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import FilterBar from '@/components/store/FilterBar';
import { productDetailPath } from '@/lib/product-urls';

export const metadata: Metadata = {
  title: 'Productos — Cabox',
  description: 'Explora nuestra colección completa de moda.',
};

interface Props {
  searchParams: Promise<{ cat?: string; q?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const locale = await getLocale();
  const { cat, q } = await searchParams;

  const categories = await prisma.category.findMany({ orderBy: { nameEs: 'asc' } });

  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      ...(cat
        ? {
            OR: [
              { primaryCategory: { slug: cat } },
              { categories: { some: { category: { slug: cat } } } },
            ],
          }
        : {}),
      ...(q
        ? {
            OR: [
              { nameEs: { contains: q, mode: 'insensitive' } },
              { nameEn: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      primaryCategory: true,
      primaryDepartment: true,
      images: { orderBy: { position: 'asc' } },
    },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
  });

  const activeCategory = categories.find((c) => c.slug === cat);
  const title = activeCategory
    ? (locale === 'es' ? activeCategory.nameEs : activeCategory.nameEn)
    : locale === 'es'
      ? 'Todos los productos'
      : 'All products';

  const countLabel =
    locale === 'es'
      ? `${products.length} ${products.length === 1 ? 'producto' : 'productos'} disponibles`
      : `${products.length} ${products.length === 1 ? 'product' : 'products'} available`;

  return (
    <>
      <PageHero title={title} subtitle={countLabel} />

      <StoreMain>
        <div className="container">
          <FilterBar categories={categories} activeCat={cat} locale={locale} />

          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
              <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</p>
              <h2>{locale === 'es' ? 'Sin resultados' : 'No results'}</h2>
              <p>
                {locale === 'es'
                  ? 'No encontramos productos para tu búsqueda.'
                  : 'We could not find products for your search.'}
              </p>
            </div>
          ) : (
            <div className="products-grid animate-fade-in">
              {products.map((product) => (
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
          )}
        </div>
      </StoreMain>
    </>
  );
}
