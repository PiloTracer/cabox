/**
 * ThemeScript — server component
 * Reads the stored themeColor from StoreSettings and injects it as
 * CSS custom property overrides into <head>. This makes the brand
 * color configurable from the admin settings page without a rebuild.
 *
 * Usage: <ThemeScript /> inside layouts (root or sub-layouts).
 */
import { prisma } from '@/lib/prisma';

// Lighten / darken a hex color by a ratio (positive = lighter, negative = darker)
function adjustColor(hex: string, ratio: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * (1 + ratio))));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * (1 + ratio))));
  const b = Math.min(255, Math.max(0, Math.round((n & 255) * (1 + ratio))));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export async function ThemeScript() {
  let themeColor = '#8B5E3C'; // brand default — exact match to globals.css

  try {
    const settings = await prisma.storeSettings.findUnique({
      where: { key: 'default' },
      select: { themeColor: true },
    });
    if (settings?.themeColor && /^#[0-9a-fA-F]{6}$/.test(settings.themeColor)) {
      themeColor = settings.themeColor;
    }
  } catch {
    // DB unavailable during cold start — fall back to default
  }

  // Derive related shades automatically so the whole theme adapts
  const dark      = adjustColor(themeColor, -0.22);  // --color-primary-dark
  const secondary = adjustColor(themeColor, +0.50);  // --color-secondary (lighter tint)

  const css = [
    `:root {`,
    `  --color-primary:      ${themeColor};`,
    `  --color-primary-dark: ${dark};`,
    `  --color-secondary:    ${secondary};`,
    `}`,
  ].join('\n');

  // dangerouslySetInnerHTML is safe here — themeColor is validated above
  return (
    <style
      id="theme-vars"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: css }}
    />
  );
}
