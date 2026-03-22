'use client';

import { ShoppingCart, Check } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '@/stores/cart-store';

interface ProductInfo {
  id: string;
  nameEs: string;
  nameEn: string;
  sku: string;
  price: number;
  currency: string;
  image: string | null;
  slug: string;
}

interface Props {
  product: ProductInfo;
  inStock: boolean;
}

export default function AddToCartButton({ product, inStock }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({
      id: product.id,
      sku: product.sku,
      nameEs: product.nameEs,
      nameEn: product.nameEn,
      slug: product.slug,
      imageUrl: product.image ?? undefined,
      price: product.price,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (!inStock) {
    return (
      <button className="btn btn-primary btn-lg" disabled>
        Agotado
      </button>
    );
  }

  return (
    <button
      className={`btn btn-lg ${added ? 'btn-success' : 'btn-primary'}`}
      onClick={handleAdd}
      style={{ minWidth: '200px', transition: 'all 0.2s ease' }}
    >
      {added ? (
        <><Check size={18} /> ¡Agregado!</>
      ) : (
        <><ShoppingCart size={18} /> Agregar al carrito</>
      )}
    </button>
  );
}
