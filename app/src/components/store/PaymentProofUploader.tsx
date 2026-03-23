'use client';

import { useState, useCallback } from 'react';

const MAX_PHOTOS = 2;
const PROOF_METHODS = ['SINPE', 'TRANSFER', 'BANK_TRANSFER'];

// helper to detect PDFs
const isPdf = (url: string) => url.toLowerCase().endsWith('.pdf');

interface Props {
  orderNumber: string;
  paymentMethod: string;
  initialProofs?: string[];
}

export default function PaymentProofUploader({ orderNumber, paymentMethod, initialProofs = [] }: Props) {
  const [proofs, setProofs]         = useState<string[]>(initialProofs);
  const [uploading, setUploading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(initialProofs.length > 0);
  const [error, setError]           = useState('');
  const [dragOver, setDragOver]     = useState(false);

  // Only show for manual payment methods
  if (!PROOF_METHODS.includes(paymentMethod)) return null;

  const uploadFile = useCallback(async (file: File) => {
    if (proofs.length >= MAX_PHOTOS) {
      setError(`Máximo ${MAX_PHOTOS} comprobantes permitidos.`);
      return;
    }

    setUploading(true);
    setError('');
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/upload/payment-proof', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setProofs(prev => [...prev, data.url]);
      } else {
        setError(data.error ?? 'Error al subir la imagen.');
      }
    } catch {
      setError('Error de red. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  }, [proofs.length]);

  const removeProof = (url: string) => {
    setProofs(prev => prev.filter(u => u !== url));
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (proofs.length === 0) { setError('Agrega al menos una foto.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/${orderNumber}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attachments: proofs, message: 'Comprobante de pago adjunto.' }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error ?? 'Error al enviar el comprobante.');
      }
    } catch {
      setError('Error de red. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const canAddMore = proofs.length < MAX_PHOTOS && !submitted;

  return (
    <div style={{
      marginTop: '1.5rem',
      padding: '1.25rem',
      background: submitted ? 'rgba(34,197,94,0.05)' : 'rgba(139,94,60,0.04)',
      border: `1.5px solid ${submitted ? 'var(--color-success,#22c55e)' : 'var(--color-primary)'}`,
      borderRadius: 'var(--radius-lg, 12px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '1.25rem' }}>{submitted ? '✅' : '📎'}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            {submitted ? 'Comprobante enviado' : 'Adjuntar comprobante de pago'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            {submitted
              ? 'Recibimos tu comprobante. Lo revisaremos pronto.'
              : `Sube hasta ${MAX_PHOTOS} fotos del comprobante (SINPE, transferencia, etc.)`
            }
          </div>
        </div>
      </div>

      {/* Thumbnail previews */}
      {proofs.length > 0 && (
        <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {proofs.map((url, i) => (
            <div key={url} style={{ position: 'relative', width: 96, height: 96 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {isPdf(url) ? (
                <div style={{
                  width: 96, height: 96, borderRadius: 8,
                  border: '1.5px solid var(--color-border)',
                  background: '#fef2f2', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                  <span style={{ fontSize: '2rem' }}>📄</span>
                  <span style={{ fontSize: '0.65rem', color: '#dc2626', fontWeight: 600 }}>PDF</span>
                </div>
              ) : (
                <img
                  src={url}
                  alt={`Comprobante ${i + 1}`}
                  style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, border: '1.5px solid var(--color-border)' }}
                />
              )}
              {!submitted && (
                <button
                  onClick={() => removeProof(url)}
                  title="Eliminar"
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#ef4444', color: '#fff',
                    border: 'none', cursor: 'pointer',
                    fontSize: '0.75rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >×</button>
              )}
              <a href={url} target="_blank" rel="noreferrer"
                style={{ position: 'absolute', bottom: 4, right: 4, fontSize: '0.65rem',
                  background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 4,
                  padding: '1px 5px', textDecoration: 'none' }}>
                Ver
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone — only if can add more */}
      {canAddMore && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault(); setDragOver(false);
            const f = e.dataTransfer.files[0]; if (f) uploadFile(f);
          }}
          onClick={() => (document.getElementById(`proof-input-cam-${orderNumber}`) as HTMLInputElement)?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: 10, padding: '1.25rem', textAlign: 'center',
            cursor: uploading ? 'wait' : 'pointer',
            background: dragOver ? 'rgba(139,94,60,0.06)' : 'transparent',
            transition: 'all 0.15s',
            marginBottom: '0.75rem',
          }}
        >
          {/* Camera input — images only, triggers rear camera on mobile */}
          <input
            id={`proof-input-cam-${orderNumber}`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            capture="environment"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ''; }}
          />
          {/* Generic file input — images + PDF, no camera */}
          <input
            id={`proof-input-file-${orderNumber}`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ''; }}
          />
          {uploading ? (
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>⏳ Subiendo…</span>
          ) : (
            <>
              <div style={{ fontSize: '1.75rem', marginBottom: 4 }}>📷</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Toca para tomar foto</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                JPG · PNG · WebP · HEIC · {MAX_PHOTOS - proofs.length} restante(s)
              </div>
              <div
                onClick={e => {
                  e.stopPropagation();
                  (document.getElementById(`proof-input-file-${orderNumber}`) as HTMLInputElement)?.click();
                }}
                style={{
                  marginTop: 8, fontSize: '0.78rem', color: 'var(--color-primary)',
                  fontWeight: 600, textDecoration: 'underline', cursor: 'pointer',
                }}
              >
                📎 Adjuntar archivo (imagen o PDF)
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <div style={{ fontSize: '0.8rem', color: 'var(--color-error, #ef4444)', marginBottom: '0.5rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Submit button */}
      {!submitted && proofs.length > 0 && (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%', padding: '0.75rem', borderRadius: 8, border: 'none',
            background: 'var(--color-primary)', color: '#fff',
            fontWeight: 700, fontSize: '0.9rem', cursor: submitting ? 'wait' : 'pointer',
            opacity: submitting ? 0.7 : 1, transition: 'opacity 0.15s',
          }}
        >
          {submitting ? 'Enviando…' : `Enviar comprobante${proofs.length > 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  );
}
