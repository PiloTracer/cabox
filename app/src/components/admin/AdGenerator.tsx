'use client';

import { useState } from 'react';
import { Sparkles, Loader, Copy, CheckCircle, Smartphone, Facebook, Instagram, Trash2, Plus } from 'lucide-react';

export type PromotionalAd = {
  id: string;
  platform: 'facebook' | 'instagram' | 'whatsapp';
  content: string;
};

interface AdGeneratorProps {
  promotionalCopy: PromotionalAd[] | null;
  onChange: (val: PromotionalAd[]) => void;
  productContext: {
    nameEs: string;
    descriptionEs: string;
    price: string;
    currency: string;
    tags?: string[];
    slug?: string;   // used to build the public product URL
  };
}

export function AdGenerator({ promotionalCopy, onChange, productContext }: AdGeneratorProps) {
  const [platform, setPlatform] = useState<'facebook' | 'instagram' | 'whatsapp'>('whatsapp');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const ads = promotionalCopy || [];

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const productUrl = productContext.slug
        ? `${appUrl}/es/products/${productContext.slug}`
        : '';

      const res = await fetch('/api/admin/ai/generate-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          product: { ...productContext, url: productUrl },
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error generating ad');

      const newAd: PromotionalAd = {
        id: Math.random().toString(36).substring(2, 9),
        platform,
        content: json.ad,
      };

      onChange([newAd, ...ads]);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, content: string) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const updateAd = (id: string, content: string) => {
    onChange(ads.map(ad => ad.id === id ? { ...ad, content } : ad));
  };

  const deleteAd = (id: string) => {
    onChange(ads.filter(ad => ad.id !== id));
  };

  const PlatformIcon = ({ p, size = 16 }: { p: string, size?: number }) => {
    if (p === 'whatsapp') return <Smartphone size={size} />;
    if (p === 'facebook') return <Facebook size={size} />;
    if (p === 'instagram') return <Instagram size={size} />;
    return <Smartphone size={size} />;
  };

  return (
    <div className="card card-body" style={{ borderColor: 'var(--color-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Sparkles size={20} color="var(--color-primary)" />
        <h3 className="form-section-title" style={{ margin: 0 }}>Material Promocional (IA)</h3>
      </div>
      
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
        Genera múltiples anuncios de texto optimizados para redes sociales usando Gemini 2.0. Los datos se guardan y solo son visibles para ti.
      </p>

      {/* Generator Section */}
      <div style={{ background: 'var(--color-bg-alt)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--color-border)' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>Nuevo Ad:</p>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setPlatform('whatsapp')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '4px',
              border: platform === 'whatsapp' ? '2px solid #25D366' : '1px solid var(--color-border)',
              background: platform === 'whatsapp' ? 'rgba(37, 211, 102, 0.1)' : 'var(--color-bg)',
              fontWeight: platform === 'whatsapp' ? 600 : 400,
              cursor: 'pointer',
              color: platform === 'whatsapp' ? '#1da851' : 'var(--color-text)',
            }}
          >
            <Smartphone size={16} /> WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setPlatform('facebook')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '4px',
              border: platform === 'facebook' ? '2px solid #1877F2' : '1px solid var(--color-border)',
              background: platform === 'facebook' ? 'rgba(24, 119, 242, 0.1)' : 'var(--color-bg)',
              fontWeight: platform === 'facebook' ? 600 : 400,
              cursor: 'pointer',
              color: platform === 'facebook' ? '#1877F2' : 'var(--color-text)',
            }}
          >
            <Facebook size={16} /> Facebook
          </button>
          <button
            type="button"
            onClick={() => setPlatform('instagram')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '4px',
              border: platform === 'instagram' ? '2px solid #E1306C' : '1px solid var(--color-border)',
              background: platform === 'instagram' ? 'rgba(225, 48, 108, 0.1)' : 'var(--color-bg)',
              fontWeight: platform === 'instagram' ? 600 : 400,
              cursor: 'pointer',
              color: platform === 'instagram' ? '#E1306C' : 'var(--color-text)',
            }}
          >
            <Instagram size={16} /> Instagram
          </button>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '0.5rem' }}>{error}</div>}

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={loading || !productContext.nameEs}
        >
          {loading ? <Loader size={16} className="spin" /> : <Plus size={16} />}
          {loading ? 'Generando...' : `Generar Ad para ${platform.charAt(0).toUpperCase() + platform.slice(1)}`}
        </button>
      </div>

      {/* List of Ads */}
      {ads.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Ads Guardados ({ads.length})</h4>
          {ads.map((ad, idx) => (
            <div key={ad.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <div style={{ padding: '0.5rem 0.75rem', background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                  <PlatformIcon p={ad.platform} />
                  {ad.platform.charAt(0).toUpperCase() + ad.platform.slice(1)} Ad #{ads.length - idx}
                </div>
                <button
                  type="button"
                  onClick={() => deleteAd(ad.id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', padding: '0.2rem' }}
                  title="Eliminar Ad"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div style={{ padding: '0.75rem' }}>
                <textarea
                  className="input"
                  rows={6}
                  value={ad.content}
                  onChange={(e) => updateAd(ad.id, e.target.value)}
                  style={{ resize: 'vertical', width: '100%', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '0.5rem' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopy(ad.id, ad.content)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  {copiedId === ad.id ? <CheckCircle size={14} color="green" /> : <Copy size={14} />}
                  {copiedId === ad.id ? '¡Copiado!' : 'Copiar texto'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
