'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ProductGalleryProps {
  images: string[];
  name: string;
  hasDiscount?: boolean;
  discountPct?: number;
}

export default function ProductGallery({ images, name, hasDiscount, discountPct }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        {images[selected] ? (
          <Image
            src={images[selected]}
            alt={name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: 'cover', borderRadius: 'var(--radius-xl)' }}
          />
        ) : (
          <div className="product-gallery-placeholder" />
        )}
        {hasDiscount && discountPct && (
          <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
            <span className="badge badge-sale">-{discountPct}%</span>
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="product-gallery-thumbs">
          {images.map((img, i) => (
            <button
              key={i}
              className={`product-gallery-thumb ${i === selected ? 'product-gallery-thumb-active' : ''}`}
              onClick={() => setSelected(i)}
              type="button"
              style={{
                padding: 0,
                border: i === selected ? '2px solid var(--color-primary)' : '2px solid transparent',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                cursor: 'pointer',
                background: 'none',
                position: 'relative',
                width: 80,
                height: 80,
                flexShrink: 0,
              }}
            >
              <Image
                src={img}
                alt={`${name} ${i + 1}`}
                fill
                sizes="80px"
                style={{ objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
