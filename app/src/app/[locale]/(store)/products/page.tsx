import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/store/ProductCard';
import { getLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import FilterBar from '@/components/store/FilterBar';

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
      ...(cat ? { category: { slug: cat } } : {}),
      ...(q ? {
        OR: [
          { nameEs: { contains: q, mode: 'insensitive' } },
          { nameEn: { contains: q, mode: 'insensitive' } },
        ],
      } : {}),
    },
    include: { category: true },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
  });

  const activeCategory = categories.find((c) => c.slug === cat);
  const title = activeCategory
    ? (locale === 'es' ? activeCategory.nameEs : activeCategory.nameEn)
    : 'Todos los productos';

  return (
    <>
      {/* Page hero */}
      <div className="page-hero">
        <div className="container">
          <h1>{title}</h1>
          <p>{products.length} {products.length === 1 ? 'producto' : 'productos'} disponibles</p>
        </div>
      </div>

      <div className="container">
        {/* Filter bar */}
        <FilterBar categories={categories} activeCat={cat} locale={locale} />

        {/* Product grid */}
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</p>
            <h2>Sin resultados</h2>
            <p>No encontramos productos para tu búsqueda.</p>
          </div>
        ) : (
          <div className="products-grid animate-fade-in">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
                  price: Number(product.price),
                  images: product.images as string[],
                }}
                locale={locale}
              />
            ))}
          </div>
        )}

        <div style={{ paddingBottom: '3rem' }} />
      </div>
    </>
  );
}
