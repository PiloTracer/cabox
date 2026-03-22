import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import Image from 'next/image';
import AddToCartButton from '@/components/store/AddToCartButton';
import ProductCard from '@/components/store/ProductCard';
import type { Metadata } from 'next';

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
      inventory: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!product || product.status !== 'ACTIVE') notFound();

  const name = locale === 'es' ? product.nameEs : product.nameEn;
  const description = locale === 'es' ? product.descriptionEs : product.descriptionEn;
  const images = (product.images as string[] | null) ?? [];

  // Total stock
  const stock = product.inventory.reduce((s, r: any) => {
    if (r.type === 'RESTOCK' || r.type === 'RETURN') return s + r.quantity;
    return s - r.quantity;
  }, 0);

  const hasDiscount = product.comparePrice && product.comparePrice > product.price;

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
    include: { category: true },
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
        {/* Image gallery */}
        <div className="product-gallery">
          <div className="product-gallery-main">
            {images[0] ? (
              <Image
                src={images[0]}
                alt={name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'cover', borderRadius: 'var(--radius-xl)' }}
              />
            ) : (
              <div className="product-gallery-placeholder" />
            )}
            {hasDiscount && (
              <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                <span className="badge badge-sale">
                  -{Math.round((1 - Number(product.price) / Number(product.comparePrice!)) * 100)}%
                </span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="product-gallery-thumbs">
              {images.slice(1, 5).map((img, i) => (
                <div key={i} className="product-gallery-thumb">
                  <Image src={img} alt={`${name} ${i + 2}`} fill sizes="80px" style={{ objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

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
                {fmt(Number(product.comparePrice))}
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
            <div className="product-description">
              <p>{description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="product-actions">
            <AddToCartButton
              product={{
                id: product.id,
                name,
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
                product={{ ...p, price: Number(p.price), comparePrice: p.comparePrice ? Number(p.comparePrice) : null, images: p.images as string[] }}
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
