import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import ProductGallery from '@/components/store/ProductGallery';
import AddToCartButton from '@/components/store/AddToCartButton';
import ProductCard from '@/components/store/ProductCard';
import type { Metadata } from 'next';

/** Lightweight markdown → HTML for product descriptions */
function simpleMarkdown(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')  // escape HTML
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')                    // **bold**
    .replace(/\*(.+?)\*/g, '<em>$1</em>')                                // *italic*
    .replace(/_(.+?)_/g, '<em>$1</em>')                                  // _italic_
    .replace(/^- (.+)$/gm, '<li>$1</li>')                               // - list items
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')                       // wrap consecutive <li> in <ul>
    .replace(/\n{2,}/g, '</p><p>')                                       // double newline = paragraph
    .replace(/\n/g, '<br/>')                                             // single newline = br
    .replace(/^/, '<p>').replace(/$/, '</p>');                            // wrap in <p>
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return { title: 'Producto no encontrado' };
  return {
    title: `${product.nameEs} — Cabox`,
    description: product.descriptionEs ?? undefined,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { position: 'asc' } },
    },
  });

  if (!product || product.status !== 'ACTIVE') notFound();

  const name = locale === 'es' ? product.nameEs : product.nameEn;
  const description = locale === 'es' ? product.descriptionEs : product.descriptionEn;
  const images = product.images.map((img: any) => img.url);
  const stock = product.stock ?? 0;

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

  // Related products
  const related = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    include: { category: true, images: { orderBy: { position: 'asc' } } },
    take: 4,
  });

  return (
    <div className="container" style={{ paddingBlock: '2.5rem' }}>
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="breadcrumb">
        <a href={`/${locale}`}>Inicio</a>
        <span>›</span>
        <a href={`/${locale}/products`}>Productos</a>
        {product.category && (
          <>
            <span>›</span>
            <a href={`/${locale}/products?cat=${product.category.slug}`}>
              {locale === 'es' ? product.category.nameEs : product.category.nameEn}
            </a>
          </>
        )}
        <span>›</span>
        <span aria-current="page">{name}</span>
      </nav>

      {/* Product layout */}
      <div className="product-detail-layout">
        <ProductGallery
          images={images}
          name={name}
          hasDiscount={!!hasDiscount}
          discountPct={discountPct}
        />

        {/* Product info */}
        <div className="product-info">
          {product.category && (
            <p className="product-card-category">{locale === 'es' ? product.category.nameEs : product.category.nameEn}</p>
          )}
          <h1 style={{ marginTop: '0.25rem', marginBottom: '1rem' }}>{name}</h1>

          {/* Price */}
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

          {/* Stock */}
          <p className="product-stock">
            {stock > 0
              ? <><span className="stock-dot stock-in" />En stock ({stock} disponibles)</>
              : <><span className="stock-dot stock-out" />Agotado</>
            }
          </p>

          {/* SKU */}
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            SKU: {product.sku}
          </p>

          {/* Description */}
          {description && (
            <div
              className="product-description"
              dangerouslySetInnerHTML={{ __html: simpleMarkdown(description) }}
            />
          )}

          {/* Actions */}
          <div className="product-actions">
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

            {/* WhatsApp buy */}
            {process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP && !process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP.includes('PLACEHOLDER') && (
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.replace(/\D/g, '')}?text=Hola! Me interesa: ${name} (${locale === 'es' ? 'Código' : 'SKU'}: ${product.sku})`}
                className="btn btn-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                💬 Comprar por WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section style={{ marginTop: '4rem' }}>
          <div className="section-header" style={{ marginBottom: '1.5rem' }}>
            <h2>Productos relacionados</h2>
          </div>
          <div className="products-grid">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={{ ...p, price: Number(p.price), comparePrice: p.compareAtPrice ? Number(p.compareAtPrice) : null, images: p.images.map((img: any) => img.url) }}
                locale={locale}
              />
            ))}
          </div>
        </section>
      )}

      <div style={{ paddingBottom: '3rem' }} />
    </div>
  );
}
