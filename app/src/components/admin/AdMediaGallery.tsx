import React, { useState, useRef } from 'react';
import { Upload, Trash2, Download, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';

export type PromotionalMedia = {
  id: string;
  url: string;
  isPublic: boolean;
  name?: string;
};

interface AdMediaGalleryProps {
  media: PromotionalMedia[];
  onChange: (media: PromotionalMedia[]) => void;
}

export default function AdMediaGallery({ media, onChange }: AdMediaGalleryProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to upload');
      }

      const { url } = await res.json();
      
      const newMedia: PromotionalMedia = {
        id: Math.random().toString(36).substring(2, 9),
        url,
        isPublic: false,
        name: file.name,
      };

      onChange([...media, newMedia]);
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  const togglePublic = (id: string) => {
    onChange(
      media.map((item) =>
        item.id === id ? { ...item, isPublic: !item.isPublic } : item
      )
    );
  };

  const deleteMedia = (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta imagen promocional?')) return;
    onChange(media.filter((item) => item.id !== id));
  };

  const downloadMedia = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = name || 'ad-image.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="card card-body" style={{ marginTop: '1.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ImageIcon size={18} />
            Ads Diseñados Offline (Imágenes)
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Sube artes, banners o promocionales creados externamente para uso en redes o escaparate.
          </p>
        </div>
        
        <div>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Upload size={14} />
            {isUploading ? 'Subiendo...' : 'Subir Arte'}
          </button>
        </div>
      </div>

      {media.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-muted)' }}>
          <ImageIcon size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
          <p style={{ margin: 0, fontSize: '0.85rem' }}>No hay artes promocionales subidos.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {media.map((item) => (
            <div
              key={item.id}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'var(--color-bg-base)',
                position: 'relative'
              }}
            >
              <div style={{ height: '140px', background: 'var(--color-border-light)', position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.name || 'Promo image'}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                   <button
                    type="button"
                    onClick={() => togglePublic(item.id)}
                    title={item.isPublic ? "Público en la tienda" : "Privado (Solo Admin)"}
                    style={{
                      background: item.isPublic ? 'var(--color-success)' : 'rgba(0,0,0,0.6)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.25rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {item.isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
              </div>
              
              <div style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                <div style={{ marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.name}>
                  <strong>{item.name || 'Ad Art'}</strong>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: item.isPublic ? 'var(--color-success)' : 'var(--color-text-muted)', fontSize: '0.7rem' }}>
                      {item.isPublic ? 'Público' : 'Privado'}
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => downloadMedia(item.url, item.name || `ad-${item.id}.png`)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem' }}
                        title="Descargar"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMedia(item.id)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.25rem' }}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
