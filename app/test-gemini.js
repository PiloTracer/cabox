const fs = require('fs');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error('No API KEY');

const prompt = `You are an expert in fashion, e-commerce, and retail in Costa Rica.
Analyze this product image with precision and return ONLY a valid JSON object.

The text fields MUST use GitHub-flavored Markdown formatting:
- Use **bold** for key features or material names
- Use bullet lists (- item) for features and benefits
- Use _italic_ for brand voice or style descriptions
- Keep descriptions scannable and customer-friendly

JSON structure requirements:
- nameEs: Product name in Spanish — concrete, appealing, max 60 chars, NO markdown.
- nameEn: Product name in English — concrete, appealing, max 60 chars, NO markdown.
- descriptionEs: Marketing description in Markdown Spanish. DIFFERENT translation, 2-3 short paragraphs. Include a bullet list of 3-4 key features. Max 600 chars.
- descriptionEn: Marketing description in Markdown English. DIFFERENT translation, 2-3 short paragraphs. Include a bullet list of 3-4 key features. Max 600 chars.
- specsEs: Technical specs in Markdown Spanish. Format as a bullet list. (Material, Dimensiones, Cierre, Colores, Temporada, Cuidados). Minimum 5 items.
- specsEn: Technical specs in Markdown English. Format as a bullet list. Minimum 5 items.
- imageSearchQuery: Short English search query (3-5 words) to find similar product photos. Example: "brown leather tote bag"
- category: Exactly one of: Mujeres, Hombres, Accesorios, Calzado, Niños, Deportivo, Casual, Formal
- suggestedPriceCRC: Integer. Realistic CRC price for Costa Rica market. Casual: 15000-50000. Premium: 50000-200000. Accessories: 8000-80000. DO NOT use US/EU prices.
- suggestedCompareAtPriceCRC: Integer or null. If item looks like a sale item, set this to original price (~15-25% higher). Otherwise null.
- sku: Short uppercase SKU, max 10 chars, format CBX-X-000
- slug: url-slug-lowercase-with-dashes based on English name — no special chars
- featured: boolean (true or false). Should be false by default unless item is a clear standout piece.
- confidence: string ("high" if fully visible, "medium" if partially visible, "low" if unclear/ambiguous)

CRITICAL RULES:
- Return ONLY valid JSON matching this exact structure with these exact keys.
- descriptionEs and descriptionEn must be DIFFERENT translations.
- specsEs and specsEn must each contain at least 5 bullet points.
- Price MUST reflect Costa Rican market pricing, never US/EU prices.`;

async function main() {
  const imgPath = '/app/tmp/image copy 2.png';
  const base64Data = fs.readFileSync(imgPath).toString('base64');
  
  const body = {
    contents: [{ parts: [
      { inlineData: { mimeType: 'image/png', data: base64Data } },
      { text: prompt }
    ]}],
    generationConfig: {
      temperature: 0.4,
      topK: 32,
      topP: 1,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
    },
  };

  console.log('Fetching...');
  const res = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\${API_KEY}\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
