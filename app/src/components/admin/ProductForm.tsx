'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader } from 'lucide-react';
import Link from 'next/link';

interface Category { id: string; nameEs: string; slug: string; }
interface ProductData {
  nameEs: string; nameEn: string;
  descriptionEs: string; descriptionEn: string;
  sku: string; slug: string;
  price: string; comparePrice: string;
  currency: string; categoryId: string;
  status: string; featured: boolean;
  images: string;
}

const EMPTY: ProductData = {
  nameEs: '', nameEn: '', descriptionEs: '', descriptionEn: '',
  sku: '', slug: '', price: '', comparePrice: '',
  currency: 'CRC', categoryId: '', status: 'DRAFT',
  featured: false, images: '',
};

export default function ProductForm({
  initial,
  productId,
  categories,
}: {
  initial?: Partial<ProductData>;
  productId?: string;
  categories: Category[];
}) {
  const router = useRouter();
  const [data, setData] = useState<ProductData>({ ...EMPTY, ...initial });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = Boolean(productId);

  // Auto-generate slug from ES name
  const set = (k: keyof ProductData, v: string | boolean) =>
    setData((d) => ({ ...d, [k]: v }));

  useEffect(() => {
    if (!isEdit && data.nameEs && !data.slug) {
      set('slug', data.nameEs.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  }, [data.nameEs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      ...data,
      price: parseFloat(data.price),
      comparePrice: data.comparePrice ? parseFloat(data.comparePrice) : null,
      images: data.images ? data.images.split('\n').map((s) => s.trim()).filter(Boolean) : [],
    };

    const res = await fetch(
      isEdit ? `/api/admin/products/${productId}` : '/api/admin/products',
      {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    setLoading(false);
    if (res.ok) {
      router.push('/admin/products');
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.message ?? 'Error guardando el producto.');
    }
  };

  const field = (label: string, key: keyof ProductData, type = 'text', placeholder = '') => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="input"
        type={type}
        value={data[key] as string}
        placeholder={placeholder}
        onChange={(e) => set(key, e.target.value)}
      />
    </div>
  );

  const textarea = (label: string, key: keyof ProductData, rows = 3) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <textarea
        className="input"
        rows={rows}
        value={data[key] as string}
        onChange={(e) => set(key, e.target.value)}
        style={{ resize: 'vertical' }}
      />
    </div>
  );

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/admin/products" className="btn btn-ghost btn-sm">
            <ArrowLeft size={16} /> Volver
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>
            {isEdit ? 'Editar producto' : 'Nuevo producto'}
          </h1>
        </div>
        <button
          type="submit"
          form="product-form"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? <><Loader size={16} className="spin" /> Guardando…</> : <><Save size={16} /> Guardar</>}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      <form id="product-form" onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          {/* Left column — main info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Names */}
            <div className="card card-body">
              <h3 className="form-section-title">Nombre del producto</h3>
              {field('Nombre (Español) *', 'nameEs', 'text', 'Ej: Camiseta Elegante')}
              {field('Name (English)', 'nameEn', 'text', 'eg. Elegant T-Shirt')}
            </div>

            {/* Descriptions */}
            <div className="card card-body">
              <h3 className="form-section-title">Descripciones</h3>
              {textarea('Descripción (Español)', 'descriptionEs', 4)}
              {textarea('Description (English)', 'descriptionEn', 4)}
            </div>

            {/* Images */}
            <div className="card card-body">
              <h3 className="form-section-title">Imágenes</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                Una URL por línea. La primera imagen es la principal.
              </p>
              {textarea('URLs de imágenes', 'images', 4)}
            </div>
          </div>

          {/* Right column — metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Pricing */}
            <div className="card card-body">
              <h3 className="form-section-title">Precio</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {field('Precio *', 'price', 'number', '0')}
                {field('Precio comparación', 'comparePrice', 'number', '0')}
              </div>
              <div className="form-group">
                <label className="form-label">Moneda</label>
                <select
                  className="input"
                  value={data.currency}
                  onChange={(e) => set('currency', e.target.value)}
                >
                  <option value="CRC">₡ Colones (CRC)</option>
                  <option value="USD">$ Dólares (USD)</option>
                </select>
              </div>
            </div>

            {/* Organización */}
            <div className="card card-body">
              <h3 className="form-section-title">Organización</h3>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select
                  className="input"
                  value={data.categoryId}
                  onChange={(e) => set('categoryId', e.target.value)}
                >
                  <option value="">Sin categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.nameEs}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select
                  className="input"
                  value={data.status}
                  onChange={(e) => set('status', e.target.value)}
                >
                  <option value="DRAFT">Borrador</option>
                  <option value="ACTIVE">Activo</option>
                  <option value="ARCHIVED">Archivado</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={data.featured}
                    onChange={(e) => set('featured', e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                  />
                  <span className="form-label" style={{ margin: 0 }}>Producto destacado</span>
                </label>
              </div>
            </div>

            {/* SEO / identifiers */}
            <div className="card card-body">
              <h3 className="form-section-title">SEO e identificadores</h3>
              {field('SKU *', 'sku', 'text', 'Ej: CAM-001')}
              {field('Slug (URL)', 'slug', 'text', 'camiseta-elegante')}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
