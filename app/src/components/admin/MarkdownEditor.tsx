'use client';

/**
 * MarkdownEditor — Write/Preview tab textarea (zero external dependencies)
 *
 * - "Escribir" tab: textarea for editing Markdown
 * - "Vista previa" tab: renders Markdown using built-in parser (no package needed)
 *
 * Supported syntax:
 *   **bold**, _italic_, # headings, - bullet lists, numbered lists,
 *   `inline code`, --- horizontal rule, blank line = paragraph break
 */

import { useState } from 'react';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  highlighted?: boolean;
  aiBadge?: boolean;
}

/** Tiny Markdown → HTML converter (no external deps) */
function parseMarkdown(md: string): string {
  let html = md
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    // Bold / italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g,     '<strong>$1</strong>')
    .replace(/_(.+?)_/g,       '<em>$1</em>')
    .replace(/\*(?!\*)(.+?)\*(?!\*)/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr/>')
    // Bullet lists
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*<\/li>\n?)+/gs, (match) => `<ul>${match}</ul>`);

  // Numbered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/gs, (match) =>
    match.includes('<ul>') ? match : `<ol>${match}</ol>`
  );

  // Paragraphs: wrap double-newline separated blocks that aren't already HTML
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (/^<(h[1-6]|ul|ol|li|hr|blockquote)/i.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');

  return html;
}

export function MarkdownEditor({
  label, value, onChange, rows = 5, highlighted = false, aiBadge = false,
}: Props) {
  const [mode, setMode] = useState<'write' | 'preview'>('write');

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 14px',
    fontSize: '0.78rem',
    fontWeight: 600,
    border: 'none',
    borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
    background: 'transparent',
    cursor: 'pointer',
    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
    transition: 'all 0.15s',
  });

  return (
    <div className="form-group">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.25rem' }}>
        <label className="form-label" style={{ marginBottom: 0 }}>
          {label}
          {aiBadge && (
            <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', color: 'var(--color-primary)', fontWeight: 700 }}>✨ IA</span>
          )}
        </label>

        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--color-border)' }}>
          <button type="button" style={tabStyle(mode === 'write')} onClick={() => setMode('write')}>
            ✏️ Escribir
          </button>
          <button type="button" style={tabStyle(mode === 'preview')} onClick={() => setMode('preview')} disabled={!value.trim()}>
            👁 Vista previa
          </button>
          {mode === 'write' && (
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', alignSelf: 'center', marginLeft: '0.5rem' }}>
              Markdown
            </span>
          )}
        </div>
      </div>

      {mode === 'write' ? (
        <textarea
          className="input"
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Soporta **Markdown**: **negrita**, _cursiva_, - listas..."
          style={{
            resize: 'vertical',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            ...(highlighted ? { borderColor: 'var(--color-primary)' } : {}),
          }}
        />
      ) : (
        <div
          className="markdown-preview"
          style={{
            minHeight: `${rows * 1.6}rem`,
            padding: '0.75rem 1rem',
            border: `1px solid ${highlighted ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)',
            overflowY: 'auto',
          }}
          // Safe: we escape HTML entities before converting Markdown
          dangerouslySetInnerHTML={{ __html: value.trim() ? parseMarkdown(value) : '<em style="color:var(--color-text-muted)">Sin contenido aún.</em>' }}
        />
      )}
    </div>
  );
}
