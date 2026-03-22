/**
 * lib/image-search.ts — Product image discovery
 *
 * Strategy (ordered by reliability):
 *  1. Google Custom Search API  — official, requires valid API key + enabled CSE
 *  2. googlethis scraper        — zero-auth fallback, scrapes Google Images directly
 *
 * Both methods have a hard 5-second timeout to prevent the API route from hanging.
 *
 * NOTE: googlethis is loaded via require() at runtime to bypass Turbopack bundling.
 * Turbopack cannot statically analyze/bundle this CJS scraping library.
 */

export interface ImageSearchResult {
  url:   string;
  title: string;
  thumb: string;
}

/** Helper: race a promise against a timeout */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => {
      setTimeout(() => {
        console.warn(`[ImageSearch] ${label} timed out after ${ms}ms`);
        resolve(null);
      }, ms);
    }),
  ]);
}

/**
 * Search for product images. Returns up to `count` results (default 8).
 *
 * 1. Tries Google CSE API (if keys are configured)
 * 2. Falls back to googlethis scraper (zero-auth, loaded at runtime)
 * 3. Returns [] if both fail — the frontend shows the empty-state UI
 */
export async function searchProductImages(
  query: string,
  count = 8
): Promise<ImageSearchResult[]> {

  // ── 1. Google Custom Search API ──────────────────────────────
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cx     = process.env.GOOGLE_CSE_SEARCH_ENGINE_ID;

  if (apiKey && cx && !apiKey.includes('PLACEHOLDER') && !cx.includes('PLACEHOLDER')) {
    try {
      const params = new URLSearchParams({
        key:        apiKey,
        cx,
        q:          query,
        searchType: 'image',
        num:        String(Math.min(count, 10)),
        safe:       'active',
        imgSize:    'large',
        imgType:    'photo',
      });

      const result = await withTimeout(
        fetch(`https://www.googleapis.com/customsearch/v1?${params}`).then(r => r.json()),
        5000,
        'Google CSE API'
      );

      if (result && !result.error && result.items?.length) {
        console.log(`[ImageSearch] Google CSE returned ${result.items.length} images`);
        return result.items.map((item: any) => ({
          url:   item.link,
          title: item.title,
          thumb: item.image?.thumbnailLink ?? item.link,
        }));
      }

      if (result?.error) {
        console.warn(`[ImageSearch] Google CSE error: ${result.error.message}`);
      }
    } catch (e) {
      console.warn('[ImageSearch] Google CSE request failed:', e);
    }
  }

  // ── 2. googlethis scraper fallback ───────────────────────────
  // Use require() at runtime to bypass Turbopack static analysis.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  try {
    console.log(`[ImageSearch] Using googlethis scraper for: "${query}"`);
    const googlethis = require('googlethis');
    const images = await withTimeout(
      googlethis.image(query, { page: 0, safe: false, additional_params: { hl: 'es' } }),
      8000,
      'googlethis scraper'
    );

    if (images && images.length > 0) {
      const results = images.slice(0, count).map((img: any) => ({
        url:   img.url   || '',
        title: img.origin?.title || query,
        thumb: img.preview?.url  || img.url || '',
      })).filter((r: ImageSearchResult) => r.url.length > 0);

      console.log(`[ImageSearch] googlethis returned ${results.length} images`);
      return results;
    }
  } catch (err) {
    console.error('[ImageSearch] googlethis fallback error:', err);
  }

  console.warn('[ImageSearch] All methods failed — returning empty array');
  return [];
}
