'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Loader, Sparkles, Upload, X,
  CheckCircle, AlertCircle, ImageIcon, Search,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { MarkdownEditor } from './MarkdownEditor';
import { AdGenerator, PromotionalAd } from './AdGenerator';
import AdMediaGallery, { PromotionalMedia } from './AdMediaGallery';

interface Category { id: string; nameEs: string; slug: string; }
interface ProductData {
  nameEs: string; nameEn: string;
  descriptionEs: string; descriptionEn: string;
  specsEs: string; specsEn: string;
  sku: string; slug: string;
  price: string; comparePrice: string;
  currency: string; categoryId: string;
  status: string; featured: boolean;
  stock: string;
  images: string;
  promotionalCopy?: PromotionalAd[] | null;
  promotionalMedia?: PromotionalMedia[] | null;
}

const EMPTY: ProductData = {
  nameEs: '', nameEn: '', descriptionEs: '', descriptionEn: '',
  specsEs: '', specsEn: '',
  sku: '', slug: '', price: '', comparePrice: '',
  currency: 'CRC', categoryId: '', status: 'DRAFT',
  featured: false, stock: '0', images: '', promotionalCopy: [], promotionalMedia: [],
};

type AIStatus = 'idle' | 'analyzing' | 'done' | 'error';

interface FoundImage { url: string; title: string; thumb: string; }

export default function ProductForm({
  initial, productId, categories,
}: {
  initial?: Partial<ProductData>;
  productId?: string;
  categories: Category[];
}) {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [data,       setData]      = useState<ProductData>({ ...EMPTY, ...initial });
  const [loading,    setLoading]   = useState(false);
  const [error,      setError]     = useState('');
  const [isDragging, setDragging]  = useState(false);

  // AI panel state
  const [aiStatus,   setAIStatus]  = useState<AIStatus>('idle');
  const [aiError,    setAIError]   = useState('');
  const [aiPreview,  setAIPreview] = useState<string | null>(null);
  const [aiFile,     setAIFile]    = useState<File | null>(null);
  const [confidence, setConfidence] = useState<string>('');
  const [foundImages,setFoundImages] = useState<FoundImage[]>([]);
  const [selectedImgs,setSelectedImgs] = useState<Set<string>>(new Set());
  const [searchingImages, setSearchingImages] = useState(false);

  const isEdit = Boolean(productId);

  const set = (k: keyof ProductData, v: string | boolean) =>
    setData((d) => ({ ...d, [k]: v }));

  // Auto-generate slug from ES name (new products only)
  useEffect(() => {
    if (!isEdit && data.nameEs && !data.slug) {
      set('slug', data.nameEs.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  }, [data.nameEs]);

  // ─── Image file handling ─────────────────────────────────────
  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setAIError('Solo se aceptan imágenes (JPG, PNG, WEBP).');
      return;
    }
    setAIFile(file);
    setAIError('');
    setFoundImages([]);
    setSelectedImgs(new Set());
    setConfidence('');
    setAIStatus('idle');
    const url = URL.createObjectURL(file);
    setAIPreview(url);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  }, [handleImageFile]);

  const clearAI = () => {
    setAIFile(null);
    setAIPreview(null);
    setAIStatus('idle');
    setAIError('');
    setFoundImages([]);
    setSelectedImgs(new Set());
    setConfidence('');
    if (fileRef.current) fileRef.current.value = '';
  };

  // ─── AI Analysis ─────────────────────────────────────────────
  const runAIAnalysis = async () => {
    if (!aiFile) return;
    setAIStatus('analyzing');
    setAIError('');

    const fd = new FormData();
    fd.append('image', aiFile);

    try {
      const res  = await fetch('/api/admin/ai/analyze-product', { method: 'POST', body: fd });
      const json = await res.json();

      if (!res.ok) {
        setAIError(json.message ?? 'Error al analizar la imagen.');
        setAIStatus('error');
        return;
      }

      // Auto-fill all form fields
      setData((d) => {
        const first3Images = (json.images ?? []).slice(0, 3).map((img: any) => img.url);
        const existingImgs = d.images ? d.images.split('\n').filter(Boolean) : [];
        const uniqueNew = first3Images.filter((url: string) => !existingImgs.includes(url));
        const newImagesStr = [...existingImgs, ...uniqueNew].join('\n');

        return {
          ...d,
          nameEs:        json.nameEs        || d.nameEs,
          nameEn:        json.nameEn        || d.nameEn,
          descriptionEs: json.descriptionEs || d.descriptionEs,
          descriptionEn: json.descriptionEn || d.descriptionEn,
          specsEs:       json.specsEs       || d.specsEs,
          specsEn:       json.specsEn       || d.specsEn,
          sku:           json.sku           || d.sku,
          slug:          json.slug          || d.slug,
          price:         json.suggestedPriceCRC ? String(json.suggestedPriceCRC) : d.price,
          comparePrice:  json.suggestedCompareAtPriceCRC ? String(json.suggestedCompareAtPriceCRC) : d.comparePrice,
          featured:      Boolean(json.featured ?? d.featured),
          categoryId:    matchCategory(json.category as string, categories) || d.categoryId,
          images:        newImagesStr,
          promotionalCopy: json.promotionalCopy || d.promotionalCopy,
          promotionalMedia: json.promotionalMedia || d.promotionalMedia,
        };
      });

      setConfidence(json.confidence ?? 'low');
      setFoundImages(json.images ?? []);
      
      // Pre-select the first 3 images that were auto-added
      const first3Urls = (json.images ?? []).slice(0, 3).map((img: any) => img.url);
      setSelectedImgs(new Set(first3Urls));
      
      setAIStatus('done');
    } catch (err) {
      console.error(err);
      setAIError('Error de conexión. Verifica que el servidor esté corriendo.');
      setAIStatus('error');
    }
  };

  // ─── Image gallery selection ──────────────────────────────────
  const toggleImage = (url: string) => {
    setSelectedImgs((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  // Apply selected images to the form's images textarea
  const applySelectedImages = () => {
    const existing = data.images ? data.images.split('\n').filter(Boolean) : [];
    const toAdd    = [...selectedImgs].filter((u) => !existing.includes(u));
    set('images', [...existing, ...toAdd].join('\n'));
    setSelectedImgs(new Set());
  };

  // ─── Standalone image search ─────────────────────────────────
  const runImageSearch = async () => {
    const query = data.nameEs || data.nameEn;
    if (!query) return;
    setSearchingImages(true);
    setFoundImages([]);
    setSelectedImgs(new Set());
    try {
      const res = await fetch('/api/admin/ai/search-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const json = await res.json();
      if (res.ok && json.images?.length) {
        setFoundImages(json.images);
      }
    } catch (err) {
      console.error('[ImageSearch] standalone search error:', err);
    } finally {
      setSearchingImages(false);
    }
  };

  // ─── Form submit ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload: any = {
      nameEs: data.nameEs,
      nameEn: data.nameEn,
      descriptionEs: data.descriptionEs,
      descriptionEn: data.descriptionEn,
      specsEs: data.specsEs,
      specsEn: data.specsEn,
      sku: data.sku,
      slug: data.slug,
      price: parseFloat(data.price),
      comparePrice: data.comparePrice ? parseFloat(data.comparePrice) : null,
      currency: data.currency,
      categoryId: data.categoryId || null,
    };

    if (data.status) payload.status = data.status;
    if (data.featured !== undefined) payload.featured = data.featured;
    if (data.stock) payload.stock = Number(data.stock);
    
    const imagesList = data.images.split('\n').filter(Boolean);
    if (imagesList.length > 0) payload.images = imagesList;

    payload.promotionalCopy = data.promotionalCopy || [];
    payload.promotionalMedia = data.promotionalMedia || [];

    const url = isEdit ? `/api/admin/products/${productId}` : '/api/admin/products';
    const res = await fetch(
      url,
      { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );

    setLoading(false);
    if (res.ok) { router.push('/admin/products'); router.refresh(); }
    else {
      const err = await res.json().catch(() => ({}));
      setError(err.message ?? 'Error guardando el producto.');
    }
  };

  // ─── Field helpers ────────────────────────────────────────────
  const hasAI = aiStatus === 'done';

  const aiBadge = hasAI
    ? <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', color: 'var(--color-primary)', fontWeight: 700, letterSpacing: '0.02em' }}>✨ IA</span>
    : null;

  const field = (label: string, key: keyof ProductData, type = 'text', placeholder = '') => (
    <div className="form-group">
      <label className="form-label">{label}{hasAI && aiBadge}</label>
      <input className="input" type={type} value={data[key] as string} placeholder={placeholder}
        onChange={(e) => set(key, e.target.value)}
        style={hasAI ? { borderColor: 'var(--color-primary)' } : undefined}
      />
    </div>
  );

  const textarea = (label: string, key: keyof ProductData, rows = 3) => (
    <div className="form-group">
      <label className="form-label">{label}{hasAI && aiBadge}</label>
      <textarea className="input" rows={rows} value={data[key] as string}
        onChange={(e) => set(key, e.target.value)}
        style={{ resize: 'vertical', ...(hasAI ? { borderColor: 'var(--color-primary)' } : {}) }}
      />
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/admin/products" className="btn btn-ghost btn-sm"><ArrowLeft size={16} /> Volver</Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>
            {isEdit ? 'Editar producto' : 'Nuevo producto'}
          </h1>
        </div>
        <button type="submit" form="product-form" className="btn btn-primary" disabled={loading}>
          {loading ? <><Loader size={16} className="spin" /> Guardando…</> : <><Save size={16} /> Guardar</>}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* ── AI Upload Panel ── */}
      <div 
        className="card card-body" 
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        style={{
        marginBottom: '1.5rem',
        border: isDragging
          ? '2px dashed var(--color-primary)'
          : hasAI
          ? '2px solid var(--color-primary)'
          : aiStatus === 'error'
          ? '2px solid var(--color-accent)'
          : '2px dashed var(--color-border)',
        background: isDragging ? 'rgba(139,69,19,0.04)' : 'var(--color-bg)',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <Sparkles size={18} color="var(--color-primary)" />
          <strong style={{ fontFamily: 'var(--font-display)' }}>Relleno Automático con IA</strong>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            Sube una foto → la IA completa todos los campos en español e inglés e incluye imágenes ilustrativas
          </span>
        </div>

        {/* Hidden file input always rendered */}
        <input ref={fileRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ''; }} style={{ display: 'none' }} />

        {/* ALWAYS VISIBLE Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            borderRadius: 'var(--radius-lg)',
            padding: aiFile ? '1.25rem 1rem' : '2.5rem 1rem', // Smaller padding if aiFile is present
            textAlign: 'center',
            cursor: 'pointer',
            border: '2px dashed var(--color-border)',
            background: 'transparent',
            marginBottom: aiFile ? '1.5rem' : 0,
            transition: 'all 0.2s',
          }}
        >
          <Upload size={aiFile ? 20 : 28} color="var(--color-text-muted)" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
          <p style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: aiFile ? '0.9rem' : '1rem' }}>
            Arrastra una foto o haz clic para seleccionar
          </p>
          {!aiFile && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>JPG · PNG · WEBP · Máx 10 MB</p>}
        </div>

        {aiFile && (
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap', padding: '1rem', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
            {/* Thumbnail */}
            <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0, background: 'var(--color-border-light)' }}>
              {aiPreview && <Image src={aiPreview} alt="preview" fill sizes="80px" style={{ objectFit: 'cover' }} unoptimized />}
              <button type="button" onClick={clearAI} title="Eliminar foto" style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={12} color="white" />
              </button>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{aiFile.name}</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>{(aiFile.size / 1024).toFixed(0)} KB</p>

              {aiStatus === 'idle' && (
                <button type="button" className="btn btn-primary" onClick={runAIAnalysis}>
                  <Sparkles size={15} /> Analizar con IA
                </button>
              )}

              {aiStatus === 'analyzing' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-primary)' }}>
                  <Loader size={16} className="spin" />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>🤖 Analizando y buscando imágenes promocionales…</span>
                </div>
              )}

              {aiStatus === 'done' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <CheckCircle size={18} color="#16a34a" />
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#16a34a' }}>¡Completado automáticamente!</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      Confianza: {confidence === 'high' ? '🟢 Alta' : confidence === 'medium' ? '🟡 Media' : '🔴 Baja'}
                      {' · '}Revisa y ajusta el precio antes de guardar.
                    </p>
                  </div>
                </div>
              )}

              {aiStatus === 'error' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <AlertCircle size={18} color="var(--color-accent)" />
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-accent)', fontWeight: 500, flex: 1 }}>{aiError}</p>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={runAIAnalysis}>Reintentar</button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── Main Form ── */}
      <form id="product-form" onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          {/* Left column */}
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
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                Soporta <strong>Markdown</strong>: <code>**negrita**</code>, <code>_cursiva_</code>, listas con <code>-</code>. Usa la pestaña <em>Vista previa</em> para ver el resultado.
              </p>
              <MarkdownEditor
                label="Descripción (Español) *"
                value={data.descriptionEs}
                onChange={(v) => set('descriptionEs', v)}
                rows={5}
                highlighted={hasAI}
                aiBadge={hasAI}
              />
              <MarkdownEditor
                label="Description (English)"
                value={data.descriptionEn}
                onChange={(v) => set('descriptionEn', v)}
                rows={5}
                highlighted={hasAI}
                aiBadge={hasAI}
              />
            </div>

            {/* Bilingual Specs */}
            <div className="card card-body">
              <h3 className="form-section-title">
                Especificaciones técnicas
                {hasAI && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 700 }}>✨ IA</span>}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                Usa listas Markdown: <code>- Material: Cuero genuino</code>. Vista previa disponible.
              </p>
              <MarkdownEditor
                label="Especificaciones (Español)"
                value={data.specsEs}
                onChange={(v) => set('specsEs', v)}
                rows={6}
                highlighted={hasAI}
                aiBadge={hasAI}
              />
              <MarkdownEditor
                label="Specifications (English)"
                value={data.specsEn}
                onChange={(v) => set('specsEn', v)}
                rows={6}
                highlighted={hasAI}
                aiBadge={hasAI}
              />
            </div>

            {/* Images */}
            <div className="card card-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <h3 className="form-section-title" style={{ margin: 0 }}>Imágenes</h3>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={(!data.nameEs && !data.nameEn) || searchingImages}
                  onClick={runImageSearch}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
                >
                  {searchingImages ? <Loader size={14} className="spin" /> : <Search size={14} />}
                  {searchingImages ? 'Buscando…' : '🔍 Buscar imágenes'}
                </button>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                La primera imagen es la principal.
              </p>

              {/* ── Found Images Gallery (inline) ── */}
              {(foundImages.length > 0 || searchingImages) && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ImageIcon size={16} color="var(--color-primary)" />
                      <strong style={{ fontSize: '0.85rem' }}>
                        {searchingImages ? 'Buscando imágenes…' : `Imágenes encontradas (${foundImages.length})`}
                      </strong>
                      {foundImages.length > 0 && !searchingImages && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>— Selecciona las que quieres usar</span>
                      )}
                    </div>
                    {selectedImgs.size > 0 && (
                      <button type="button" className="btn btn-primary btn-sm" onClick={applySelectedImages}>
                        ✓ Agregar {selectedImgs.size} imagen{selectedImgs.size > 1 ? 'es' : ''}
                      </button>
                    )}
                  </div>
                  {searchingImages ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                      <Loader size={24} className="spin" style={{ margin: '0 auto' }} />
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Buscando imágenes de producto…</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {foundImages.map((img) => {
                        const selected = selectedImgs.has(img.url);
                        return (
                          <div key={img.url} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: 180 }}>
                            <button
                              type="button"
                              onClick={() => toggleImage(img.url)}
                              title={img.title}
                              style={{
                                position: 'relative',
                                width: '100%',
                                height: 180,
                                borderRadius: 'var(--radius-md)',
                                overflow: 'hidden',
                                border: selected ? '3px solid var(--color-primary)' : '2px solid var(--color-border)',
                                background: 'var(--color-border-light)',
                                padding: 0,
                                cursor: 'pointer',
                                transition: 'border 0.15s, transform 0.15s',
                                transform: selected ? 'scale(1.05)' : 'scale(1)',
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.thumb}
                                alt={img.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                              {selected && (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(139,69,19,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <CheckCircle size={22} color="white" />
                                </div>
                              )}
                            </button>
                            <a href={img.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.65rem', textAlign: 'center', color: 'var(--color-primary)', textDecoration: 'underline', fontWeight: 600 }}>👁️ Ver</a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Visual thumbnail list with remove buttons */}
              {data.images && data.images.split('\n').filter(Boolean).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {data.images.split('\n').filter(Boolean).map((url, idx) => (
                    <div
                      key={url + idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem',
                        background: idx === 0 ? 'rgba(139,69,19,0.06)' : 'var(--color-bg-alt)',
                        borderRadius: 'var(--radius-md)',
                        border: idx === 0 ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                      }}
                    >
                      {/* Thumbnail */}
                      <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--color-border-light)' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url.trim()}
                          alt={`Imagen ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>

                      {/* URL + badge */}
                      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        {idx === 0 && (
                          <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            ★ Principal
                          </span>
                        )}
                        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                          {url.trim()}
                        </p>
                      </div>

                      {/* Remove button */}
                      <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const urls = data.images.split('\n').filter(Boolean);
                              const [moved] = urls.splice(idx, 1);
                              urls.unshift(moved);
                              set('images', urls.join('\n'));
                            }}
                            title="Establecer como imagen principal"
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              border: '1px solid var(--color-primary)',
                              background: 'transparent',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--color-primary)',
                              fontSize: '0.8rem',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,69,19,0.1)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                          >
                            ★
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const urls = data.images.split('\n').filter(Boolean);
                            urls.splice(idx, 1);
                            set('images', urls.join('\n'));
                          }}
                          title="Eliminar imagen"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            border: '1px solid var(--color-border)',
                            background: 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-accent)',
                            transition: 'background 0.15s, color 0.15s',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(220,38,38,0.1)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                  Sin imágenes. Usa el análisis de IA o pega URLs abajo.
                </p>
              )}

              {/* Manual URL textarea for adding more */}
              <details style={{ marginTop: '0.25rem' }}>
                <summary style={{ cursor: 'pointer', fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                  ✏️ Editar URLs manualmente
                </summary>
                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <label className="form-label">URLs de imágenes{hasAI && aiBadge}</label>
                  <textarea
                    className="input"
                    rows={4}
                    value={data.images}
                    onChange={(e) => set('images', e.target.value)}
                    placeholder="Una URL por línea"
                    style={{ resize: 'vertical', fontSize: '0.75rem', ...(hasAI ? { borderColor: 'var(--color-primary)' } : {}) }}
                  />
                </div>
              </details>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* PRICE — always prominent, always editable */}
            <div className="card card-body" style={hasAI ? { border: '2px solid var(--color-primary)' } : {}}>
              <h3 className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                Precio
                {hasAI && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-primary)', background: 'rgba(139,69,19,0.1)', padding: '2px 8px', borderRadius: '999px' }}>
                    ✨ Sugerido por IA — edita a tu gusto
                  </span>
                )}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                {/* Price */}
                <div className="form-group">
                  <label className="form-label">
                    Precio *{' '}
                    {hasAI && <span style={{ fontSize: '0.65rem', color: 'var(--color-primary)', fontWeight: 600 }}>(editable)</span>}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
                      {data.currency === 'CRC' ? '₡' : '$'}
                    </span>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="100"
                      value={data.price}
                      placeholder="0"
                      onChange={(e) => set('price', e.target.value)}
                      style={{ paddingLeft: '1.75rem', fontSize: '1.15rem', fontWeight: 700 }}
                    />
                  </div>
                </div>

                {/* Compare-at price */}
                <div className="form-group">
                  <label className="form-label">Precio comparación</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
                      {data.currency === 'CRC' ? '₡' : '$'}
                    </span>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="100"
                      value={data.comparePrice}
                      placeholder="0"
                      onChange={(e) => set('comparePrice', e.target.value)}
                      style={{ paddingLeft: '1.75rem' }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Moneda</label>
                <select className="input" value={data.currency} onChange={(e) => set('currency', e.target.value)}>
                  <option value="CRC">₡ Colones (CRC)</option>
                  <option value="USD">$ Dólares (USD)</option>
                </select>
              </div>
            </div>

            {/* Inventario */}
            <div className="card card-body">
              <h3 className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📦 Inventario
              </h3>
              <div className="form-group">
                <label className="form-label">Stock disponible</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="1"
                    value={data.stock}
                    placeholder="0"
                    onChange={(e) => set('stock', e.target.value)}
                    style={{ maxWidth: 120, fontSize: '1.1rem', fontWeight: 700 }}
                  />
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: '999px',
                    background: Number(data.stock) > 5 ? 'rgba(34,197,94,0.12)' : Number(data.stock) > 0 ? 'rgba(234,179,8,0.12)' : 'rgba(239,68,68,0.12)',
                    color: Number(data.stock) > 5 ? '#16a34a' : Number(data.stock) > 0 ? '#ca8a04' : '#dc2626',
                  }}>
                    {Number(data.stock) > 5 ? '🟢 En stock' : Number(data.stock) > 0 ? '🟡 Stock bajo' : '🔴 Agotado'}
                  </span>
                </div>
              </div>
            </div>

            {/* Organization */}
            <div className="card card-body">
              <h3 className="form-section-title">Organización</h3>
              <div className="form-group">
                <label className="form-label">Categoría{hasAI && aiBadge}</label>
                <select className="input" value={data.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                  <option value="">Sin categoría</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.nameEs}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select className="input" value={data.status} onChange={(e) => set('status', e.target.value)}>
                  <option value="DRAFT">Borrador</option>
                  <option value="ACTIVE">Activo</option>
                  <option value="ARCHIVED">Archivado</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={data.featured} onChange={(e) => set('featured', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} />
                  <span className="form-label" style={{ margin: 0 }}>Producto destacado</span>
                </label>
              </div>
            </div>

            {/* SEO */}
            <div className="card card-body">
              <h3 className="form-section-title">SEO e identificadores</h3>
              {field('SKU *', 'sku', 'text', 'Ej: CAM-001')}
              {field('Slug (URL)', 'slug', 'text', 'camiseta-elegante')}
            </div>

            {/* AI Promociones */}
            <AdGenerator 
              promotionalCopy={data.promotionalCopy || null}
              onChange={(val) => set('promotionalCopy', val as any)}
              productContext={{
                nameEs: data.nameEs,
                descriptionEs: data.descriptionEs,
                price: data.price,
                currency: data.currency,
                slug: data.slug,
              }}
            />

            <AdMediaGallery
              media={data.promotionalMedia || []}
              onChange={(media) => set('promotionalMedia', media as any)}
            />

          </div>
        </div>

        {/* ── Sticky action bar at bottom ── */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
          gap: '1rem', padding: '1.25rem 1.5rem',
          marginTop: '1.5rem',
          background: 'var(--color-bg-base)',
          borderTop: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          position: 'sticky', bottom: 0, zIndex: 10,
        }}>
          {error && <span style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>{error}</span>}
          <Link href="/admin/products" className="btn btn-ghost btn-sm">Cancelar</Link>
          <button type="submit" form="product-form" className="btn btn-primary" disabled={loading}>
            {loading ? <><Loader size={16} className="spin" /> Guardando…</> : <><Save size={16} /> Guardar producto</>}
          </button>
        </div>
      </form>
    </div>
  );
}

/** Match AI category suggestion to an actual category ID */
function matchCategory(aiCategory: string, categories: Category[]): string {
  if (!aiCategory) return '';
  const lower = aiCategory.toLowerCase();
  const match = categories.find(
    (c) => c.nameEs.toLowerCase().includes(lower) || lower.includes(c.nameEs.toLowerCase())
  );
  return match?.id ?? '';
}
