'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

interface GeneralSettings {
  storeName:    string;
  storeTagline: string;
  footerText:   string;
  supportPhone: string;
  logoUrl:      string;
  heroImageUrl: string;
  themeColor:   string;
}

const DEFAULTS: GeneralSettings = {
  storeName:    'Cabox',
  storeTagline: 'Moda Curada de Costa Rica',
  footerText:   'Moda curada con amor · Costa Rica',
  supportPhone: '',
  logoUrl:      '/logo.png',
  heroImageUrl: '',
  themeColor:   '#8B5E3C',
};

// Curated preset palettes that suit boutique/luxury stores
const COLOR_PRESETS = [
  { label: 'Cabox Brown',   value: '#8B5E3C' },
  { label: 'Copper',        value: '#AD6F45' },
  { label: 'Terracotta',    value: '#C0603A' },
  { label: 'Burgundy',      value: '#7B2D3E' },
  { label: 'Forest Green',  value: '#2D6A4F' },
  { label: 'Slate Blue',    value: '#3B5998' },
  { label: 'Deep Ocean',    value: '#1A4A6C' },
  { label: 'Charcoal',      value: '#3A3A3A' },
  { label: 'Gold',          value: '#A07830' },
  { label: 'Rose Gold',     value: '#B76E79' },
];

export default function GeneralSettingsForm() {
  const [form, setForm]     = useState<GeneralSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');
  // Logo upload
  const [logoMode, setLogoMode]       = useState<'upload' | 'url'>('upload');
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver]       = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setForm({
          storeName:    data.storeName    ?? DEFAULTS.storeName,
          storeTagline: data.storeTagline ?? DEFAULTS.storeTagline,
          footerText:   data.footerText   ?? DEFAULTS.footerText,
          supportPhone: data.supportPhone ?? DEFAULTS.supportPhone,
          logoUrl:      data.logoUrl      ?? DEFAULTS.logoUrl,
          heroImageUrl: data.heroImageUrl ?? DEFAULTS.heroImageUrl,
          themeColor:   data.themeColor   ?? DEFAULTS.themeColor,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (field: keyof GeneralSettings) => (
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  );

  const uploadLogo = async (file: File) => {
    setUploading(true);
    setUploadError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm(prev => ({ ...prev, logoUrl: data.url }));
      } else {
        setUploadError(data.error ?? 'Error al subir la imagen');
      }
    } catch {
      setUploadError('Error de red al subir');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3500);
        // Apply theme color change immediately in the current page
        document.documentElement.style.setProperty('--color-primary', form.themeColor);
      } else {
        setError('Error al guardar.');
      }
    } catch {
      setError('Error de red.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        Cargando…
      </div>
    );
  }

  return (
    <div className="settings-form">

      {/* ── Identity ── */}
      <div className="settings-section-title" style={{ marginBottom: '1rem' }}>Identidad de la tienda</div>
      <div className="settings-card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Nombre de la tienda</label>
            <input className="input" value={form.storeName} onChange={set('storeName')} placeholder="Cabox" />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">WhatsApp de soporte</label>
            <input className="input" value={form.supportPhone} onChange={set('supportPhone')} placeholder="+506 8888-8888" />
          </div>
          <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
            <label className="form-label">Eslogan / Tagline</label>
            <input className="input" value={form.storeTagline} onChange={set('storeTagline')} placeholder="Moda Curada de Costa Rica" />
          </div>
          <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
            <label className="form-label">Texto del pie de página (footer)</label>
            <input className="input" value={form.footerText} onChange={set('footerText')} placeholder="Moda curada con amor · Costa Rica" />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              Aparece en la parte inferior del sitio.
            </span>
          </div>
        </div>
      </div>

      {/* ── Images ── */}
      <div className="settings-section-title" style={{ marginBottom: '1rem' }}>Imágenes</div>
      <div className="settings-card" style={{ marginBottom: '1.25rem' }}>

        {/* Logo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start', marginBottom: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Logotipo</label>

            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: 0, marginBottom: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, overflow: 'hidden', width: 'fit-content' }}>
              {(['upload', 'url'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setLogoMode(m)}
                  style={{
                    padding: '4px 14px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: logoMode === m ? 'var(--color-primary)' : 'transparent',
                    color: logoMode === m ? '#fff' : 'var(--color-text-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {m === 'upload' ? '⬆ Subir archivo' : '🔗 URL externa'}
                </button>
              ))}
            </div>

            {logoMode === 'upload' ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) uploadLogo(f);
                }}
                onClick={() => (document.getElementById('logo-file-input') as HTMLInputElement)?.click()}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 8,
                  padding: '1rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragOver ? 'rgba(139,94,60,0.05)' : 'transparent',
                  transition: 'all 0.15s',
                  minHeight: 80,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <input
                  id="logo-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }}
                />
                {uploading ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>⏳ Subiendo…</span>
                ) : (
                  <>
                    <span style={{ fontSize: '1.5rem' }}>🖼️</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Arrastra una imagen o haz clic para seleccionar</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', opacity: 0.7 }}>JPG, PNG, WebP, GIF, SVG · máx. 5 MB</span>
                  </>
                )}
              </div>
            ) : (
              <input
                className="input"
                value={form.logoUrl}
                onChange={set('logoUrl')}
                placeholder="/logo.png o https://…/logo.png"
              />
            )}

            {uploadError && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)', marginTop: 4, display: 'block' }}>{uploadError}</span>}
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4, display: 'block' }}>Tamaño recomendado: 48×48 px (cuadrado).</span>
          </div>

          {/* Live logo preview */}
          <div style={{ flexShrink: 0, paddingTop: 28 }}>
            <div style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', border: '1.5px solid var(--color-border)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {form.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.logoUrl}
                  alt="Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
                />
              ) : (
                <span style={{ fontSize: '1.5rem', opacity: 0.25 }}>🏪</span>
              )}
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 4 }}>Vista previa</div>
          </div>
        </div>

        {/* Hero */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">URL de imagen hero (sección principal)</label>
          <input
            className="input"
            value={form.heroImageUrl}
            onChange={set('heroImageUrl')}
            placeholder="https://…/hero.jpg"
            style={{ marginBottom: '0.75rem' }}
          />

          {/* Always-visible hero preview panel */}
          <div
            style={{
              position: 'relative',
              height: 200,
              borderRadius: 10,
              overflow: 'hidden',
              border: '1.5px solid var(--color-border)',
              background: form.heroImageUrl ? '#111' : '#f5f0eb',
            }}
          >
            {form.heroImageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.heroImageUrl}
                  alt="Hero preview"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    const el = e.currentTarget as HTMLImageElement;
                    el.style.display = 'none';
                    const fallback = el.parentElement?.querySelector('.hero-error') as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                {/* Gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)' }} />
                {/* Simulated content overlay */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', textShadow: '0 2px 8px rgba(0,0,0,0.5)', marginBottom: '0.3rem' }}>
                    {form.storeName || 'Cabox'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.88)', textShadow: '0 1px 4px rgba(0,0,0,0.5)', marginBottom: '0.75rem' }}>
                    {form.storeTagline || 'Moda Curada de Costa Rica'}
                  </div>
                  <div style={{ background: form.themeColor, color: '#fff', padding: '6px 20px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                    Ver colección
                  </div>
                </div>
                {/* URL load error fallback */}
                <div className="hero-error" style={{ display: 'none', position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--color-text-muted)', background: '#f5f0eb' }}>
                  <span style={{ fontSize: '1.5rem' }}>🖼️</span>
                  <span style={{ fontSize: '0.8rem' }}>No se pudo cargar la imagen</span>
                </div>
              </>
            ) : (
              /* Empty state */
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, border: '2px dashed var(--color-border)', borderRadius: 10 }}>
                <span style={{ fontSize: '1.75rem', opacity: 0.4 }}>🖼️</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Escribe una URL de imagen para ver la vista previa</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', opacity: 0.7 }}>Resolución recomendada: 1440×600</span>
              </div>
            )}
          </div>

          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 6, display: 'block' }}>
            Imagen de fondo del banner principal. La vista previa simula el aspecto real en la tienda.
          </span>
        </div>
      </div>


      {/* ── Theme Color ── */}
      <div className="settings-section-title" style={{ marginBottom: '1rem' }}>Color del tema</div>
      <div className="settings-card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
          Este color se usa en botones, enlaces, iconos activos y detalles de diseño en toda la tienda y el panel de administración.
        </p>

        {/* Preset swatches with labels */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.875rem', marginBottom: '1.25rem' }}>
          {COLOR_PRESETS.map(p => (
            <div
              key={p.value}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
              onClick={() => setForm(prev => ({ ...prev, themeColor: p.value }))}
            >
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: p.value,
                border: form.themeColor === p.value ? '3px solid #1a1a1a' : '2px solid var(--color-border)',
                transition: 'transform 0.15s, border 0.15s, box-shadow 0.15s',
                transform: form.themeColor === p.value ? 'scale(1.15)' : 'scale(1)',
                boxShadow: form.themeColor === p.value ? '0 3px 10px rgba(0,0,0,0.3)' : 'none',
              }} />
              <span style={{
                fontSize: '0.65rem',
                color: form.themeColor === p.value ? 'var(--color-text)' : 'var(--color-text-muted)',
                fontWeight: form.themeColor === p.value ? 700 : 400,
                textAlign: 'center',
                lineHeight: 1.2,
                maxWidth: 52,
              }}>
                {p.label}
              </span>
            </div>
          ))}
        </div>

        {/* Custom HEX input */}
        <div className="form-group" style={{ margin: '0 0 1.5rem' }}>
          <label className="form-label">Color personalizado (HEX)</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', maxWidth: 260 }}>
            <input
              type="color"
              value={form.themeColor}
              onChange={e => setForm(prev => ({ ...prev, themeColor: e.target.value }))}
              style={{ width: 44, height: 40, padding: 2, borderRadius: 6, border: '1.5px solid var(--color-border)', cursor: 'pointer', background: 'none', flexShrink: 0 }}
            />
            <input
              className="input"
              value={form.themeColor}
              onChange={e => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setForm(prev => ({ ...prev, themeColor: v }));
              }}
              style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
              maxLength={7}
              placeholder="#8B5E3C"
            />
          </div>
        </div>

        {/* ── Live Preview Panel ── */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.875rem' }}>
            Vista previa en vivo
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

            {/* Left: interactive elements */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Buttons */}
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>Botones</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ background: form.themeColor, color: '#fff', padding: '8px 18px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, boxShadow: `0 2px 6px ${form.themeColor}55` }}>
                    Agregar al carrito
                  </div>
                  <div style={{ border: `1.5px solid ${form.themeColor}`, color: form.themeColor, padding: '8px 18px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 500 }}>
                    Ver más
                  </div>
                </div>
              </div>

              {/* Link + badge */}
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>Enlace / Badge</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ color: form.themeColor, fontSize: '0.875rem', fontWeight: 500, textDecoration: 'underline', textDecorationColor: `${form.themeColor}66`, cursor: 'pointer' }}>
                    Ver colección →
                  </span>
                  <span style={{ background: `${form.themeColor}18`, color: form.themeColor, padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                    NUEVO
                  </span>
                </div>
              </div>

              {/* Heading + body text */}
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>Tipografía</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.05rem', fontWeight: 700, color: form.themeColor, marginBottom: '0.2rem' }}>
                  Moda curada de Costa Rica
                </div>
                <div style={{ fontSize: '0.8rem', color: '#5a4a3a', lineHeight: 1.5 }}>
                  Piezas únicas con carácter. Diseñadas para durar.
                </div>
              </div>
            </div>

            {/* Right: mini card mock-up */}
            <div style={{ background: '#fff', border: `1px solid ${form.themeColor}30`, borderRadius: 12, overflow: 'hidden', boxShadow: `0 4px 16px ${form.themeColor}22` }}>
              {/* Card image placeholder */}
              <div style={{ background: `${form.themeColor}18`, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${form.themeColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.2rem' }}>👗</span>
                </div>
              </div>
              {/* Card body */}
              <div style={{ padding: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#2a1a0a' }}>Blusa de Lino</div>
                  <span style={{ background: `${form.themeColor}18`, color: form.themeColor, padding: '1px 6px', borderRadius: 20, fontSize: '0.6rem', fontWeight: 700 }}>NUEVO</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.5rem' }}>Talla M · Natural</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: form.themeColor, fontSize: '0.85rem' }}>₡18,500</span>
                  <div style={{ background: form.themeColor, color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600 }}>
                    + Carrito
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Error */}
      {error && <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}

      {/* Save bar */}
      <div className="settings-save-bar">
        {saved && <span className="settings-save-status">✅ Guardado — los cambios se aplican al siguiente ciclo del servidor</span>}
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ minWidth: 180, justifyContent: 'center' }}
        >
          {saving ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite', marginRight: 6 }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Guardando…
            </>
          ) : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
