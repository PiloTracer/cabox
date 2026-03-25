import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { generateContent } from '@/lib/gemini';
import { searchProductImages } from '@/lib/image-search';

/**
 * POST /api/admin/ai/analyze-product
 *
 * Accepts: multipart/form-data { image: File }
 *
 * Pipeline (runs in parallel where possible):
 *  1. Gemini 1.5 Flash vision → identifies product, generates all text fields in Markdown (ES + EN),
 *     bilingual technical specs, SKU, slug, CRC price suggestion, confidence level
 *  2. Google CSE → searches for illustrative product images using AI-suggested query
 *
 * All text content (descriptions, specs) is returned in GitHub-flavored Markdown.
 */
export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const formData  = await req.formData();
  const imageFile = formData.get('image') as File | null;
  const additionalImages = formData.getAll('additionalImage') as File[];

  if (!imageFile) {
    return NextResponse.json({ message: 'Se requiere un archivo de imagen.' }, { status: 400 });
  }

  // Convert primary image → base64 for Gemini inlineData
  const bytes      = await imageFile.arrayBuffer();
  const base64Data = Buffer.from(bytes).toString('base64');
  const mimeType   = (imageFile.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp';

  // Convert additional images to Gemini inline parts
  const additionalParts: { inlineData: { mimeType: string; data: string } }[] = [];
  for (const addImg of additionalImages) {
    if (!addImg || typeof addImg === 'string') continue;
    const addBytes = await addImg.arrayBuffer();
    additionalParts.push({
      inlineData: {
        mimeType: addImg.type || 'image/jpeg',
        data: Buffer.from(addBytes).toString('base64'),
      },
    });
  }

  const totalImages = 1 + additionalParts.length;
  const multiImageNote = totalImages > 1
    ? `\nIMPORTANT: I'm providing ${totalImages} product photos. Analyze ALL of them together to identify the product with maximum accuracy. Use all visual cues across the images to generate the most complete and detailed response.`
    : '';

  const prompt = `You are an expert in fashion, e-commerce, and retail in Costa Rica.
Analyze this product image with precision and return ONLY a valid JSON object.${multiImageNote}

The text fields MUST use GitHub-flavored Markdown formatting:
- Use **bold** for key features or material names
- Use bullet lists (- item) for features and benefits
- Use _italic_ for brand voice or style descriptions
- Keep descriptions scannable and customer-friendly

JSON structure requirements:
- nameEs: Product name in Spanish — concrete, appealing, max 60 chars, NO markdown.
- nameEn: Product name in English — concrete, appealing, max 60 chars, NO markdown.
- descriptionEs: Marketing description in Markdown Spanish. DIFFERENT translation, 1-2 short paragraphs. Include a bullet list of 3-4 key features.
- descriptionEn: Marketing description in Markdown English. DIFFERENT translation, 1-2 short paragraphs. Include a bullet list of 3-4 key features.
- specsEs: Technical specs in Markdown Spanish. Format as a bullet list. (Material, Dimensiones, Cierre, Colores, Temporada, Cuidados). Minimum 5 items.
- specsEn: Technical specs in Markdown English. Format as a bullet list. Minimum 5 items.
- imageSearchQuery: An extremely precise English search query (BRAND + EXACT MODEL NAME + COLOR) to find official promotional photos of this exact product on Google. Example: "Nike Pegasus 40 orange running shoe official"
- category: Exactly one of: Mujeres, Hombres, Accesorios, Calzado, Niños, Deportivo, Casual, Formal
- suggestedCompareAtPriceCRC: Integer. YOU MUST FIND THE BEST MATCH FOR THIS EXACT PRODUCT ON AMAZON AND THE INTERNET in general. Convert this real-world market price to Costa Rican Colones (CRC). Do not hallucinate. Provide the most accurate local market price possible.
- suggestedPriceCRC: Integer. THIS MUST BE EXACTLY 75% OF THE \`suggestedCompareAtPriceCRC\` value. Calculate it mathematically (suggestedCompareAtPriceCRC * 0.75) and return the integer.
- sku: Short uppercase SKU, max 10 chars, format CBX-X-000
- slug: url-slug-lowercase-with-dashes based on English name — no special chars
- featured: boolean (true or false). Should be false by default unless item is a clear standout piece.
- confidence: string ("high" if fully visible, "medium" if partially visible, "low" if unclear/ambiguous)

CRITICAL RULES:
- Return ONLY valid JSON matching this exact structure with these exact keys.
- descriptionEs and descriptionEn must be DIFFERENT translations.
- specsEs and specsEn must each contain at least 5 bullet points.
- Price MUST reflect Costa Rican market pricing, never US/EU prices.`;

  try {
    // Build parts: primary image + additional images + prompt text
    const geminiParts = [
      { inlineData: { mimeType, data: base64Data } },
      ...additionalParts,
      { text: prompt },
    ];

    const rawText = await generateContent(
      geminiParts,
      'gemini-2.5-flash'
    );
    const cleaned = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('[AI analyze-product] JSON parse failed. Raw output:\n\n=== START RAW ===\n', cleaned, '\n=== END RAW ===\n');
      return NextResponse.json(
        { message: 'La IA no devolvió JSON válido. Intenta con otra imagen o ángulo diferente.' },
        { status: 502 }
      );
    }

    // Run Google image search in parallel with the AI-suggested query
    const searchQuery = String(parsed.imageSearchQuery ?? parsed.nameEn ?? 'fashion product');
    const foundImages = await searchProductImages(searchQuery, 8);

    return NextResponse.json({
      nameEs:                     String(parsed.nameEs ?? ''),
      nameEn:                     String(parsed.nameEn ?? ''),
      descriptionEs:              String(parsed.descriptionEs ?? ''),
      descriptionEn:              String(parsed.descriptionEn ?? ''),
      specsEs:                    String(parsed.specsEs ?? ''),
      specsEn:                    String(parsed.specsEn ?? ''),
      category:                   String(parsed.category ?? ''),
      sku:                        String(parsed.sku ?? ''),
      slug:                       String(parsed.slug ?? ''),
      featured:                   Boolean(parsed.featured ?? false),
      suggestedCompareAtPriceCRC: parsed.suggestedCompareAtPriceCRC
        ? Number(parsed.suggestedCompareAtPriceCRC)
        : null,
      suggestedPriceCRC: parsed.suggestedCompareAtPriceCRC 
        ? Math.floor(Number(parsed.suggestedCompareAtPriceCRC) * 0.75)
        : Number(parsed.suggestedPriceCRC ?? 0),
      confidence:       String(parsed.confidence ?? 'low'),
      imageSearchQuery: searchQuery,
      images:           foundImages,
    });
  } catch (err) {
    console.error('[AI analyze-product] Error:', err);
    return NextResponse.json(
      { message: 'Error al analizar la imagen. Verifica tu GEMINI_API_KEY en .env.dev.' },
      { status: 502 }
    );
  }
}
