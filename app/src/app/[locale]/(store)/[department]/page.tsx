import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/store/ProductCard';
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

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>{locale === 'es' ? dept.nameEs : dept.nameEn}</h1>
          <p>{locale === 'es' ? dept.taglineEs : dept.taglineEn}</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: '3rem' }}>
        {categoryPills.length > 0 && (
          <section style={{ paddingBlock: '2rem' }}>
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
          </section>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>Destacados</h2>
          <Link href={`/${locale}/${dept.slug}/products`} className="btn btn-secondary btn-sm">
            Ver todos →
          </Link>
        </div>

        {featured.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Sin productos destacados aún.</p>
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
    </>
  );
}
