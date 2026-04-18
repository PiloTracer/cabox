/* eslint-disable @typescript-eslint/no-explicit-any */

/** Allowed font tokens — departments cannot inject arbitrary font-family (security) */
const ALLOWED_FONTS = new Set([
  'Playfair Display',
  'Inter',
  'Poppins',
  'DM Serif Display',
  'Lora',
]);

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const HSLA_RE = /^hsla?\([^)]+\)$/;

export type SanitizedTheme = Record<string, string>;

export function sanitizeThemeJson(raw: unknown): SanitizedTheme {
  if (raw === null || raw === undefined) return {};
  if (typeof raw !== 'object' || Array.isArray(raw)) return {};

  const out: SanitizedTheme = {};
  const obj = raw as Record<string, unknown>;

  const colorKeys = [
    'primary', 'primaryDark', 'secondary', 'accent', 'bg', 'bgCard',
    'text', 'textMuted', 'border', 'borderLight', 'sale', 'success', 'warning', 'error',
  ];

  for (const k of colorKeys) {
    const v = obj[k];
    if (typeof v !== 'string') continue;
    const s = v.trim();
    if (HEX_RE.test(s) || HSLA_RE.test(s)) out[k] = s;
  }

  for (const fk of ['displayFont', 'bodyFont'] as const) {
    const v = obj[fk];
    if (typeof v !== 'string') continue;
    if (ALLOWED_FONTS.has(v.trim())) out[fk] = v.trim();
  }

  for (const uk of ['logoUrl', 'heroImageUrl'] as const) {
    const v = obj[uk];
    if (typeof v !== 'string') continue;
    const s = v.trim();
    if (s.startsWith('/') && !s.includes('//') && s.length < 512) {
      out[uk] = s;
      continue;
    }
    try {
      const url = new URL(s);
      if (url.protocol === 'https:') out[uk] = s;
    } catch {
      /* skip */
    }
  }

  return out;
}

/** Maps sanitized keys to existing globals.css custom properties */
export function themeToCssVariables(theme: SanitizedTheme): Record<string, string> {
  const map: Record<string, string> = {
    primary: '--color-primary',
    primaryDark: '--color-primary-dark',
    secondary: '--color-secondary',
    accent: '--color-accent',
    bg: '--color-bg',
    bgCard: '--color-bg-card',
    text: '--color-text',
    textMuted: '--color-text-muted',
    border: '--color-border',
    borderLight: '--color-border-light',
    sale: '--color-sale',
    success: '--color-success',
    warning: '--color-warning',
    error: '--color-error',
    displayFont: '--font-display',
    bodyFont: '--font-body',
  };
  const vars: Record<string, string> = {};
  for (const [k, cssVar] of Object.entries(map)) {
    if (theme[k]) vars[cssVar] = theme[k];
  }
  return vars;
}

export function renderDepartmentThemeStyles(
  departmentSlug: string,
  theme: SanitizedTheme,
): string {
  const vars = themeToCssVariables(theme);
  if (Object.keys(vars).length === 0) return '';
  const safe = departmentSlug.replace(/[^a-z0-9-]/gi, '');
  const sel = `.theme-dept-${safe}`;
  const rules = Object.entries(vars)
    .map(([prop, val]) => `  ${prop}: ${val};`)
    .join('\n');
  return `${sel} {\n${rules}\n}\n`;
}
