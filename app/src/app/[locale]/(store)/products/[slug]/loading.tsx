import React from 'react';

export default function ProductDetailLoading() {
  return (
    <div className="product-page">
      <div className="container" style={{ margin: '2rem auto' }}>
        <div className="skeleton" style={{ width: '200px', height: '1.2rem', marginBottom: '2rem', borderRadius: '4px' }} />
        
        <div className="product-layout">
          {/* Gallery Skeleton */}
          <div className="product-gallery">
            <div className="product-gallery-main skeleton" style={{ aspectRatio: '3/4', borderRadius: 'var(--radius-lg)' }} />
            <div className="product-gallery-thumbs" style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
              <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)' }} />
              <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)' }} />
              <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)' }} />
            </div>
          </div>

          {/* Info Skeleton */}
          <div className="product-info-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div className="skeleton" style={{ height: '3rem', width: '80%', borderRadius: '4px', marginBottom: '1rem' }} />
              <div className="skeleton" style={{ height: '2rem', width: '40%', borderRadius: '4px' }} />
            </div>
            
            <div className="skeleton" style={{ height: '4rem', width: '100%', borderRadius: '4px' }} />
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="skeleton" style={{ height: '3.5rem', width: '120px', borderRadius: '4px' }} />
              <div className="skeleton" style={{ height: '3.5rem', flex: 1, borderRadius: '4px' }} />
            </div>

            <div style={{ marginTop: '2rem' }}>
              <div className="skeleton" style={{ height: '1.5rem', width: '30%', borderRadius: '4px', marginBottom: '1rem' }} />
              <div className="skeleton" style={{ height: '1rem', width: '90%', borderRadius: '4px', marginBottom: '0.5rem' }} />
              <div className="skeleton" style={{ height: '1rem', width: '85%', borderRadius: '4px', marginBottom: '0.5rem' }} />
              <div className="skeleton" style={{ height: '1rem', width: '70%', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
