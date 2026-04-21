import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import ProductGallery from '@/components/store/ProductGallery';
import AddToCartButton from '@/components/store/AddToCartButton';
import ProductCard from '@/components/store/ProductCard';
import ShareButton from '@/components/store/ShareButton';
import { StoreSectionHeader } from '@/components/store/StoreSection';
import type { Metadata } from 'next';
import { productDetailPath } from '@/lib/product-urls';

function simpleMarkdown(md: string): string {
  return md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

interface Props {
  params: Promise<{ department: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { department: deptSlug, slug } = await params;
  const locale = await getLocale();

  const dept = await prisma.department.findFirst({
    where: { slug: deptSlug, isActive: true },
  });
  if (!dept) return { title: 'No encontrado' };

  const product = await prisma.product.findFirst({
    where: {
      slug,
      status: 'ACTIVE',
      departments: { some: { departmentId: dept.id } },
    },
    include: { primaryDepartment: true },
  });
  if (!product) return { title: 'Producto no encontrado' };

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.cabox.app';
  const canonicalPath = productDetailPath(locale, product.primaryDepartment.slug, product.slug);
  const canonical = `${base}${canonicalPath}`;

  return {
    title: `${product.nameEs} — Cabox`,
    description: product.descriptionEs?.slice(0, 160) ?? undefined,
    alternates: { canonical },
  };
}

export default async function DepartmentProductDetailPage({ params }: Props) {
  const { department: departmentSlug, slug } = await params;
  const locale = await getLocale();

  const dept = await prisma.department.findFirst({
    where: { slug: departmentSlug, isActive: true },
  });
  if (!dept) notFound();

  const product = await prisma.product.findFirst({
    where: {
      slug,
      status: 'ACTIVE',
      departments: { some: { departmentId: dept.id } },
    },
    include: {
      primaryCategory: true,
      primaryDepartment: true,
      images: { orderBy: { position: 'asc' } },
    },
  });

  if (!product) notFound();

  const name = locale === 'es' ? product.nameEs : product.nameEn;
  const description = locale === 'es' ? product.descriptionEs : product.descriptionEn;
  const images = product.images.map((img) => img.url);
  const stock = product.stock ?? 0;
  const canonicalDept = product.primaryDepartment.slug;

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - Number(product.price) / Number(product.compareAtPrice!)) * 100)
    : 0;

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: product.currency === 'USD' ? 'USD' : 'CRC',
      maximumFractionDigits: 0,
    }).format(n);

  const related = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      primaryCategoryId: product.primaryCategoryId,
      id: { not: product.id },
      departments: { some: { departmentId: dept.id } },
    },
    include: {
      primaryCategory: true,
      primaryDepartment: true,
      images: { orderBy: { position: 'asc' } },
    },
    take: 4,
  });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.cabox.app';
  const canonicalUrl = `${base}${productDetailPath(locale, canonicalDept, product.slug)}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    image: images,
    description: description || name,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'CRC',
      price: Number(product.price),
      availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Cabox' },
    },
  };

  const cat = product.primaryCategory;
  const deptHome = `/${locale}/${dept.slug}`;
  const deptProducts = `/${locale}/${dept.slug}/products`;
  const canonicalProducts = `/${locale}/${canonicalDept}/products`;

  return (
    <div className={`theme-dept-${dept.slug} container`} style={{ paddingBlock: '2.5rem' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="breadcrumb" aria-label="breadcrumb">
        <a href={`/${locale}`}>Inicio</a>
        <span>›</span>
        <a href={deptHome}>{locale === 'es' ? dept.nameEs : dept.nameEn}</a>
        <span>›</span>
        <a href={deptProducts}>Productos</a>
        {cat && (
          <>
            <span>›</span>
            <a href={`${deptProducts}?cat=${cat.slug}`}>
              {locale === 'es' ? cat.nameEs : cat.nameEn}
            </a>
          </>
        )}
        <span>›</span>
        <span aria-current="page">{name}</span>
      </nav>

      {canonicalDept !== dept.slug && (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          {locale === 'es'
            ? 'Estás viendo este artículo en otro departamento. La URL principal está en '
            : 'You are viewing this item in another department. The canonical listing is at '}
          <a href={`${canonicalProducts}/${product.slug}`} style={{ fontWeight: 600 }}>
            /{locale}/{canonicalDept}/products/{product.slug}
          </a>
        </p>
      )}

      <div className="product-detail-layout">
        <ProductGallery
          images={images}
          name={name}
          hasDiscount={!!hasDiscount}
          discountPct={discountPct}
        />

        <div className="product-info">
          {cat && (
            <p className="product-card-category">
              {locale === 'es' ? cat.nameEs : cat.nameEn}
            </p>
          )}
          <h1 style={{ marginTop: '0.25rem', marginBottom: '1rem' }}>{name}</h1>

          <div className="product-info-prices">
            <span className={`price product-price ${hasDiscount ? 'price-sale' : ''}`}>
              {fmt(Number(product.price))}
            </span>
            {hasDiscount && (
              <span className="price price-original product-compare-price">
                {fmt(Number(product.compareAtPrice))}
              </span>
            )}
          </div>

          <p className="product-stock">
            {stock > 0 ? (
              <>
                <span className="stock-dot stock-in" />
                En stock ({stock} disponibles)
              </>
            ) : (
              <>
                <span className="stock-dot stock-out" />
                Agotado
              </>
            )}
          </p>

          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            SKU: {product.sku}
          </p>

          {description && (
            <div
              className="product-description"
              dangerouslySetInnerHTML={{ __html: simpleMarkdown(description) }}
            />
          )}

          {(() => {
            const specs = locale === 'es' ? product.specsEs : product.specsEn;
            if (!specs) return null;
            return (
              <details className="product-specs" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <summary
                  style={{
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    padding: '0.75rem 0',
                    borderTop: '1px solid var(--color-border, #e5e7eb)',
                    borderBottom: '1px solid var(--color-border, #e5e7eb)',
                    listStyle: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none',
                    color: 'var(--color-text)',
                  }}
                >
                  {locale === 'es' ? 'Especificaciones' : 'Specifications'}
                  <span style={{ fontSize: '1.1rem' }}>▸</span>
                </summary>
                <div
                  className="product-description"
                  style={{ paddingTop: '1rem' }}
                  dangerouslySetInnerHTML={{ __html: simpleMarkdown(specs) }}
                />
              </details>
            );
          })()}

          <div className="product-actions" style={{ marginBottom: '2rem' }}>
            <AddToCartButton
              product={{
                id: product.id,
                nameEs: product.nameEs,
                nameEn: product.nameEn ?? product.nameEs,
                sku: product.sku,
                price: Number(product.price),
                currency: product.currency,
                image: images[0] ?? null,
                slug: product.slug,
              }}
              inStock={stock > 0}
            />

            {process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP &&
              !process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP.includes('PLACEHOLDER') && (
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.replace(/\D/g, '')}?text=Hola! Me interesa: ${name} (${locale === 'es' ? 'Código' : 'SKU'}: ${product.sku})`}
                  className="btn btn-secondary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  💬 Comprar por WhatsApp
                </a>
              )}

            <ShareButton title={name} text={description ?? undefined} locale={locale} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="store-related-products">
          <StoreSectionHeader
            title={locale === 'es' ? 'Productos relacionados' : 'Related products'}
            className="store-section-header--related"
          />
          <div className="products-grid">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  ...p,
                  price: Number(p.price),
                  comparePrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
                  images: p.images.map((img) => img.url),
                  category: p.primaryCategory
                    ? { slug: p.primaryCategory.slug, nameEs: p.primaryCategory.nameEs }
                    : null,
                }}
                locale={locale}
                detailHref={productDetailPath(
                  locale,
                  p.primaryDepartment.slug,
                  p.slug,
                )}
              />
            ))}
          </div>
        </section>
      )}

      <div style={{ paddingBottom: '3rem' }} />
    </div>
  );
}
