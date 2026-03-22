import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { searchProductImages } from '@/lib/image-search';

/**
 * POST /api/admin/ai/search-images
 *
 * Standalone image search endpoint — allows searching for product images
 * independently from the full AI analysis pipeline.
 *
 * Accepts: { query: string }
 * Returns: { images: ImageSearchResult[] }
 */
export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  let body: { query?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body.' }, { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json(
      { message: 'Se requiere un "query" para buscar imágenes.' },
      { status: 400 }
    );
  }

  try {
    const images = await searchProductImages(query, 8);
    return NextResponse.json({ images });
  } catch (err) {
    console.error('[search-images] Error:', err);
    return NextResponse.json(
      { message: 'Error al buscar imágenes.' },
      { status: 502 }
    );
  }
}
