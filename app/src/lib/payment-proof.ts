/**
 * Detects PDF payment proof attachments from URL (path only; query string ignored).
 */
export function isPaymentProofPdfUrl(url: string): boolean {
  try {
    const pathOnly = url.toLowerCase().split('?')[0] ?? '';
    return pathOnly.endsWith('.pdf');
  } catch {
    return false;
  }
}
