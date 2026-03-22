/**
 * lib/format.ts — Centralized formatting utilities
 *
 * SINGLE SOURCE OF TRUTH for all number, currency, and date formatting.
 * Do NOT duplicate these helpers inline in pages or components.
 */

/**
 * Format a number as Costa Rican Colones (CRC).
 * @example formatCRC(15000) → "₡15.000"
 */
export function formatCRC(amount: number | string | { valueOf(): number }): string {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

/**
 * Format a number as US Dollars (USD).
 */
export function formatUSD(amount: number | string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

/**
 * Format a date in Costa Rican locale (short).
 * @example formatDate(new Date()) → "22/3/2026"
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('es-CR');
}

/**
 * Format a date with time in Costa Rican locale.
 */
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('es-CR');
}

/**
 * Format a percentage.
 * @example formatPct(13.5) → "13.5%"
 */
export function formatPct(value: number): string {
  return `${value}%`;
}
