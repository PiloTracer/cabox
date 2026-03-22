'use client';

import Image from 'next/image';
import { useState, useCallback } from 'react';

interface ProductGalleryProps {
  images: string[];
  name: string;
  hasDiscount?: boolean;
  discountPct?: number;
}

export default function ProductGallery({ images, name, hasDiscount, discountPct }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  // Track which image indices have failed to load
  const [broken, setBroken] = useState<Set<number>>(new Set());

  const markBroken = useCallback((idx: number) => {
    setBroken((prev) => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
  }, []);

  // Filter to only valid images (non-broken)
  const validImages = images.filter((_, i) => !broken.has(i));
  const selectedSrc = images[selected];
  const isBroken = broken.has(selected);

  // Auto-advance to a valid image if current one broke
  const effectiveSrc = isBroken ? validImages[0] ?? null : selectedSrc;

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        {effectiveSrc ? (
          <>
            {/* Blurred background fill */}
            <Image
              src={effectiveSrc}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'cover', filter: 'blur(28px) saturate(1.2)', transform: 'scale(1.15)', opacity: 0.55 }}
              aria-hidden="true"
              priority={false}
              onError={() => markBroken(selected)}
            />
            {/* Main image — contained (never cropped, never distorted) */}
            <Image
              src={effectiveSrc}
              alt={name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'contain', zIndex: 1 }}
              onError={() => markBroken(selected)}
            />
          </>
        ) : (
          <div className="product-gallery-placeholder">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.25 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
        {hasDiscount && discountPct && (
          <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 2 }}>
            <span className="badge badge-sale">-{discountPct}%</span>
          </div>
        )}
      </div>
      {validImages.length > 1 && (
        <div className="product-gallery-thumbs">
          {images.map((img, i) => {
            if (broken.has(i)) return null; // Skip broken thumbnails
            return (
              <button
                key={i}
                className={`product-gallery-thumb ${images[selected] === img || (isBroken && img === validImages[0]) ? 'product-gallery-thumb-active' : ''}`}
                onClick={() => setSelected(i)}
                type="button"
                style={{
                  padding: 0,
                  border: (images[selected] === img && !isBroken) ? '2px solid var(--color-primary)' : '2px solid transparent',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: 'var(--color-border-light)',
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
                  onError={() => markBroken(i)}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
