'use client';

import Image from 'next/image';
import { useState, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  name: string;
  hasDiscount?: boolean;
  discountPct?: number;
}

export default function ProductGallery({ images, name, hasDiscount, discountPct }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [broken, setBroken] = useState<Set<number>>(new Set());

  // Zoom / Lightbox states
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setMousePos({ x, y });
  };

  // Lock scroll when lightbox is open
  useEffect(() => {
    if (isLightboxOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isLightboxOpen]);

  const navLightbox = (dir: 1 | -1, e: React.MouseEvent) => {
    e.stopPropagation();
    let nextIdx = selected + dir;
    if (nextIdx >= images.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = images.length - 1;
    setSelected(nextIdx);
  };

  return (
    <>
      <div className="product-gallery">
        <div 
          className="product-gallery-main"
          style={{ position: 'relative', overflow: 'hidden', cursor: 'zoom-in' }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onMouseMove={handleMouseMove}
          onClick={() => setIsLightboxOpen(true)}
        >
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
              style={{ 
                objectFit: 'contain', 
                zIndex: 1,
                transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                transform: isHovering ? 'scale(2)' : 'scale(1)',
                transition: isHovering ? 'transform 0.1s ease-out' : 'transform 0.3s ease-out',
                pointerEvents: 'none' // Let the parent catch mouse moves smoothly
              }}
              onError={() => markBroken(selected)}
            />
            {/* Zoom hint icon */}
            <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', zIndex: 2, background: 'rgba(255,255,255,0.8)', padding: '0.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', opacity: isHovering ? 0 : 1, transition: 'opacity 0.2s', pointerEvents: 'none' }}>
              <ZoomIn size={20} color="#333" />
            </div>
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
      
      {/* Lightbox Modal */}
      {isLightboxOpen && effectiveSrc && (
        <div 
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)'
          }}
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close button */}
          <button 
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', zIndex: 10000 }}
            onClick={() => setIsLightboxOpen(false)}
          >
            <X size={28} />
          </button>

          {/* Navigation */}
          {validImages.length > 1 && (
            <>
              <button 
                style={{ position: 'absolute', left: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '1rem', borderRadius: '50%', cursor: 'pointer', zIndex: 10000 }}
                onClick={(e) => navLightbox(-1, e)}
              >
                <ChevronLeft size={36} />
              </button>
              <button 
                style={{ position: 'absolute', right: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '1rem', borderRadius: '50%', cursor: 'pointer', zIndex: 10000 }}
                onClick={(e) => navLightbox(1, e)}
              >
                <ChevronRight size={36} />
              </button>
            </>
          )}

          {/* Lightbox Image */}
          <div style={{ position: 'relative', width: '90vw', height: '85vh', maxWidth: '1200px' }} onClick={(e) => e.stopPropagation()}>
            <Image
              src={effectiveSrc}
              alt={name}
              fill
              style={{ objectFit: 'contain' }}
              sizes="100vw"
              quality={100}
            />
          </div>

          {/* Thumbnail strip in lightbox */}
          {validImages.length > 1 && (
            <div style={{ position: 'absolute', bottom: '1.5rem', display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.5)', padding: '0.5rem', borderRadius: '1rem' }} onClick={(e) => e.stopPropagation()}>
              {validImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(images.indexOf(img))}
                  style={{
                    width: '48px', height: '48px', position: 'relative', borderRadius: '0.3rem', overflow: 'hidden', border: selected === images.indexOf(img) ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', padding: 0
                  }}
                >
                  <Image src={img} alt="" fill style={{ objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
