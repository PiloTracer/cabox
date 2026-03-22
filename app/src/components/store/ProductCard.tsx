import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';

interface Product {
  id: string;
  slug: string;
  nameEs: string;
  nameEn: string;
  price: number;
  comparePrice?: number | null;
  currency: string;
  featured: boolean;
  status: string;
  images: string[];
  category?: { slug: string; nameEs: string } | null;
}

interface ProductCardProps {
  product: Product;
  locale: string;
}

export default function ProductCard({ product, locale }: ProductCardProps) {
  const name = locale === 'es' ? product.nameEs : product.nameEn;
  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.comparePrice!) * 100)
    : 0;

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: product.currency === 'USD' ? 'USD' : 'CRC',
      maximumFractionDigits: 0,
    }).format(n);

  const imageSrc = product.images?.[0] ?? null;

  return (
    <Link href={`/${locale}/products/${product.slug}`} className="product-card">
      {/* Image */}
      <div className="product-card-img">
        {imageSrc ? (
          <SafeImage
            src={imageSrc}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="product-card-photo"
          />
        ) : (
          <div className="product-card-placeholder" />
        )}

        {/* Badges */}
        <div className="product-card-badges">
          {hasDiscount && (
            <span className="badge badge-sale">-{discountPct}%</span>
          )}
          {product.featured && !hasDiscount && (
            <span className="badge badge-new">Nuevo</span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="product-card-body">
        {product.category && (
          <p className="product-card-category">{product.category.nameEs}</p>
        )}
        <h3 className="product-card-name">{name}</h3>
        <div className="product-card-prices">
          <span className={`price ${hasDiscount ? 'price-sale' : ''}`}>
            {fmt(product.price)}
          </span>
          {hasDiscount && (
            <span className="price price-original">{fmt(product.comparePrice!)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
