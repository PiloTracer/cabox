import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/store/ProductCard';
import { PageHero } from '@/components/store/PageHero';
import { StoreMain, StoreSectionHeader } from '@/components/store/StoreSection';
import { productDetailPath } from '@/lib/product-urls';
import { getDepartmentBySlug } from '@/lib/departments';

interface Props {
  params: Promise<{ department: string }>;
}

export default async function DepartmentHomePage({ params }: Props) {
  const { department: deptSlug } = await params;
  const locale = await getLocale();

  const dept = await getDepartmentBySlug(deptSlug);
  if (!dept) notFound();

  const dc = await prisma.departmentCategory.findMany({
    where: { departmentId: dept.id },
    include: { category: true },
    orderBy: { position: 'asc' },
  });
  const categoryPills = dc.map((r) => r.category);

  const name = locale === 'es' ? dept.nameEs : dept.nameEn;
  const rawTagline = locale === 'es' ? dept.taglineEs : dept.taglineEn;
  const tagline =
    typeof rawTagline === 'string' && rawTagline.trim().length > 0 ? rawTagline.trim() : undefined;

  const featured = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      featured: true,
      departments: { some: { departmentId: dept.id } },
    },
    include: {
      primaryCategory: true,
      primaryDepartment: true,
      images: { orderBy: { position: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: 8,
  });

  const featuredTitle = locale === 'es' ? 'Destacados' : 'Featured';
  const viewAll = locale === 'es' ? 'Ver todos →' : 'View all →';
  const emptyFeatured =
    locale === 'es' ? 'Sin productos destacados aún.' : 'No featured products yet.';

  return (
    <>
      <PageHero variant="compact" title={name} subtitle={tagline} />

      <StoreMain>
        <div className="container">
          {categoryPills.length > 0 && (
            <nav
              className="store-category-nav"
              aria-label={locale === 'es' ? 'Categorías del departamento' : 'Department categories'}
            >
              <div className="category-pills">
                {categoryPills.map((c) => (
                  <Link
                    key={c.id}
                    href={`/${locale}/${dept.slug}/products?cat=${c.slug}`}
                    className="category-pill"
                  >
                    {locale === 'es' ? c.nameEs : c.nameEn}
                  </Link>
                ))}
              </div>
            </nav>
          )}

          <StoreSectionHeader
            title={featuredTitle}
            action={
              <Link href={`/${locale}/${dept.slug}/products`} className="btn btn-secondary btn-sm">
                {viewAll}
              </Link>
            }
          />

          {featured.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>{emptyFeatured}</p>
          ) : (
            <div className="products-grid animate-fade-in">
              {featured.map((p) => (
                <ProductCard
                  key={p.id}
                  product={{
                    ...p,
                    comparePrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
                    price: Number(p.price),
                    images: p.images.map((img) => img.url),
                    category: p.primaryCategory
                      ? { slug: p.primaryCategory.slug, nameEs: p.primaryCategory.nameEs }
                      : null,
                  }}
                  locale={locale}
                  detailHref={productDetailPath(locale, p.primaryDepartment.slug, p.slug)}
                />
              ))}
            </div>
          )}
        </div>
      </StoreMain>
    </>
  );
}
