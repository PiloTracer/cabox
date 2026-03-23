import React from 'react';

export default function ProductCardSkeleton() {
  return (
    <div className="product-card" style={{ cursor: 'default' }}>
      <div 
        className="product-card-image skeleton" 
        style={{ aspectRatio: '3/4', width: '100%' }}
      />
      <div className="product-card-content" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {/* Category skeleton */}
        <div className="skeleton" style={{ height: '0.8rem', width: '40%', borderRadius: '4px' }} />
        {/* Title skeleton */}
        <div className="skeleton" style={{ height: '1.2rem', width: '80%', borderRadius: '4px' }} />
        {/* Price skeleton */}
        <div className="skeleton" style={{ height: '1.2rem', width: '30%', borderRadius: '4px', marginTop: '0.5rem' }} />
      </div>
    </div>
  );
}
