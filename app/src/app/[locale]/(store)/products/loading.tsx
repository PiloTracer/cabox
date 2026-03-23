import ProductCardSkeleton from '@/components/store/ProductCardSkeleton';

export default function ProductsLoading() {
  return (
    <>
      <div className="page-hero">
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div className="skeleton" style={{ width: '250px', maxWidth: '80%', height: '3rem', borderRadius: '4px' }} />
          <div className="skeleton" style={{ width: '120px', height: '1.2rem', borderRadius: '4px' }} />
        </div>
      </div>

      <div className="container">
        {/* Fake Filter Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          <div className="skeleton" style={{ width: '6rem', height: '2.5rem', borderRadius: '2rem' }} />
          <div className="skeleton" style={{ width: '5rem', height: '2.5rem', borderRadius: '2rem' }} />
          <div className="skeleton" style={{ width: '7rem', height: '2.5rem', borderRadius: '2rem' }} />
          <div className="skeleton" style={{ width: '6rem', height: '2.5rem', borderRadius: '2rem' }} />
        </div>

        {/* Skeleton Grid */}
        <div className="products-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
        <div style={{ paddingBottom: '3rem' }} />
      </div>
    </>
  );
}
