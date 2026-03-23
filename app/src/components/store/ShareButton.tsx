'use client';

import { useState, useEffect, useRef } from 'react';

interface ShareButtonProps {
  title: string;
  text?: string;
  locale?: string;
}

export default function ShareButton({ title, text, locale = 'es' }: ShareButtonProps) {
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ url: window.location.href, title })
    );
  }, [title]);

  /* Close dropdown on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const sharePayload = {
    url: typeof window !== 'undefined' ? window.location.href : '',
    title,
    text: text ?? title,
  };

  const label = locale === 'es' ? 'Compartir' : 'Share';

  /* ── Native share ── */
  if (canNativeShare) {
    return (
      <button
        type="button"
        className="btn btn-ghost"
        onClick={async () => {
          try { await navigator.share(sharePayload); } catch { /* cancelled */ }
        }}
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        aria-label={label}
      >
        <ShareIcon /> {label}
      </button>
    );
  }

  /* ── Fallback dropdown ── */
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text ?? title);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        aria-label={label}
      >
        <ShareIcon /> {label}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 0.5rem)',
            left: 0,
            zIndex: 200,
            minWidth: '12rem',
            background: 'var(--color-bg-card, #fff)',
            border: '1px solid var(--color-border, #e5e7eb)',
            borderRadius: '0.75rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.15rem',
          }}
        >
          <DropdownItem
            href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
            emoji="💬"
            label="WhatsApp"
          />
          <DropdownItem
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            emoji="📘"
            label="Facebook"
          />
          <DropdownItem
            href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`}
            emoji="🐦"
            label="X / Twitter"
          />
          <DropdownItem
            href={`mailto:?subject=${encodedText}&body=${encodedUrl}`}
            emoji="✉️"
            label={locale === 'es' ? 'Correo' : 'Email'}
            external={false}
          />
          <hr style={{ margin: '0.25rem 0', border: 'none', borderTop: '1px solid var(--color-border, #e5e7eb)' }} />
          <button
            type="button"
            role="menuitem"
            onClick={copyLink}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.55rem 0.75rem', borderRadius: '0.5rem',
              border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '0.875rem', textAlign: 'left', width: '100%',
              color: copied ? 'var(--color-success, #16a34a)' : 'inherit',
            }}
          >
            <span>{copied ? '✅' : '🔗'}</span>
            {copied
              ? (locale === 'es' ? '¡Copiado!' : 'Copied!')
              : (locale === 'es' ? 'Copiar enlace' : 'Copy link')}
          </button>
        </div>
      )}
    </div>
  );
}

function DropdownItem({ href, emoji, label, external = true }: { href: string; emoji: string; label: string; external?: boolean }) {
  return (
    <a
      href={href}
      role="menuitem"
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.55rem 0.75rem', borderRadius: '0.5rem',
        fontSize: '0.875rem', textDecoration: 'none', color: 'inherit',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover, #f3f4f6)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span>{emoji}</span> {label}
    </a>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
