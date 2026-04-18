import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/store/ProductCard';
import { getLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import FilterBar from '@/components/store/FilterBar';
import { notFound } from 'next/navigation';
import { productDetailPath } from '@/lib/product-urls';
import { getDepartmentBySlug } from '@/lib/departments';

interface Props {
  params: Promise<{ department: string }>;
  searchParams: Promise<{ cat?: string; q?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { department: deptSlug } = await params;
  const dept = await getDepartmentBySlug(deptSlug);
  if (!dept) return { title: 'Departamento' };
  return {
    title: `${dept.nameEs} — Productos — Cabox`,
    description: dept.taglineEs || `Productos en ${dept.nameEs}`,
  };
}

export default async function DepartmentProductsPage({ params, searchParams }: Props) {
  const locale = await getLocale();
  const { department: deptSlug } = await params;
  const { cat, q } = await searchParams;

  const dept = await getDepartmentBySlug(deptSlug);
  if (!dept) notFound();

  const dc = await prisma.departmentCategory.findMany({
    where: { departmentId: dept.id },
    include: { category: true },
    orderBy: { position: 'asc' },
  });
  const categories = dc.map((r) => r.category);

  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      departments: { some: { departmentId: dept.id } },
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
    ? locale === 'es'
      ? activeCategory.nameEs
      : activeCategory.nameEn
    : locale === 'es'
      ? dept.nameEs
      : dept.nameEn;

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>{title}</h1>
          <p>
            {products.length} {products.length === 1 ? 'producto' : 'productos'} disponibles
          </p>
        </div>
      </div>

      <div className="container">
        <FilterBar categories={categories} activeCat={cat} locale={locale} />

        {products.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem 0',
              color: 'var(--color-text-muted)',
            }}
          >
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

        <div style={{ paddingBottom: '3rem' }} />
      </div>
    </>
  );
}
