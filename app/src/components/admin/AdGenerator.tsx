'use client';

import { useState } from 'react';
import { Sparkles, Loader, Copy, CheckCircle, Smartphone, Facebook, Instagram } from 'lucide-react';

export type PromotionalCopy = {
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
};

interface AdGeneratorProps {
  promotionalCopy: PromotionalCopy | null;
  onChange: (val: PromotionalCopy) => void;
  productContext: {
    nameEs: string;
    descriptionEs: string;
    price: string;
    currency: string;
    tags?: string[];
  };
}

export function AdGenerator({ promotionalCopy, onChange, productContext }: AdGeneratorProps) {
  const [platform, setPlatform] = useState<'facebook' | 'instagram' | 'whatsapp'>('whatsapp');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const currentCopy = promotionalCopy?.[platform] || '';

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/admin/ai/generate-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          product: productContext,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error generating ad');

      onChange({
        ...(promotionalCopy || {}),
        [platform]: json.ad,
      });
      
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!currentCopy) return;
    navigator.clipboard.writeText(currentCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card card-body" style={{ borderColor: 'var(--color-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Sparkles size={20} color="var(--color-primary)" />
        <h3 className="form-section-title" style={{ margin: 0 }}>Material Promocional (IA)</h3>
      </div>
      
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
        Genera anuncios de texto optimizados para redes sociales usando Gemini 2.0. Los datos se guardan y solo son visibles para ti.
      </p>

      {/* Platform Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setPlatform('whatsapp')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '4px',
            border: platform === 'whatsapp' ? '2px solid #25D366' : '1px solid var(--color-border)',
            background: platform === 'whatsapp' ? 'rgba(37, 211, 102, 0.1)' : 'transparent',
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
            background: platform === 'facebook' ? 'rgba(24, 119, 242, 0.1)' : 'transparent',
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
            background: platform === 'instagram' ? 'rgba(225, 48, 108, 0.1)' : 'transparent',
            fontWeight: platform === 'instagram' ? 600 : 400,
            cursor: 'pointer',
            color: platform === 'instagram' ? '#E1306C' : 'var(--color-text)',
          }}
        >
          <Instagram size={16} /> Instagram
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '0.5rem' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <textarea
          className="input"
          rows={8}
          placeholder={`Aquí aparecerá el copy para ${platform}...`}
          value={currentCopy}
          onChange={(e) => onChange({ ...promotionalCopy, [platform]: e.target.value })}
          style={{ resize: 'vertical', width: '100%', fontSize: '0.9rem', lineHeight: 1.5 }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={loading || !productContext.nameEs}
          >
            {loading ? <Loader size={16} className="spin" /> : <Sparkles size={16} />}
            {loading ? 'Generando...' : '✨ Generar con IA'}
          </button>

          {currentCopy && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCopy}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              {copied ? <CheckCircle size={16} color="green" /> : <Copy size={16} />}
              {copied ? '¡Copiado!' : 'Copiar texto'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
