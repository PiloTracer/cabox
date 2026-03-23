import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { generateContent } from '@/lib/gemini';
import { authOptions } from '@/lib/auth';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return session;
}

export async function POST(req: Request) {
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { platform, product } = body;

    if (!platform || !product) {
      return NextResponse.json({ error: 'Missing platform or product data' }, { status: 400 });
    }

    // Prepare prompt according to the selected platform
    let platformGuide = '';
    if (platform === 'facebook') {
      platformGuide = 'Focus on engagement. Use a conversational tone, storytelling elements, and a solid call to action. Include a couple of relevant emojis.';
    } else if (platform === 'instagram') {
      platformGuide = 'Focus on aesthetics and visual appeal. Use an engaging tone, high-energy emojis, and a block of trending/relevant hashtags at the end.';
    } else if (platform === 'whatsapp') {
      platformGuide = 'Focus on direct, fast sales. Be very concise, friendly, and clear. Mention the price upfront. Use emojis effectively to break up the short text.';
    }

    const systemPrompt = `
      You are an expert digital marketer for a premium Costa Rican fashion e-commerce called "Cabox".
      Generate a professional, compelling advertisement for the following product:
      
      Name: ${product.nameEs || product.nameEn}
      Description: ${product.descriptionEs || product.descriptionEn}
      Price: ${product.price} ${product.currency}
      Tags: ${(product.tags || []).join(', ')}
      
      Platform Requirements for ${platform.toUpperCase()}:
      ${platformGuide}
      
      Language: Spanish (Costa Rica localization).
      
      IMPORTANT: Return ONLY valid JSON with exactly this structure:
      {
        "ad": "the generated text here, formatted appropriately..."
      }
    `;

    const aiText = await generateContent([{ text: systemPrompt }]);
    const parsed = JSON.parse(aiText);

    if (!parsed.ad) {
      throw new Error('AI response missing "ad" key.');
    }

    return NextResponse.json({ ad: parsed.ad });
  } catch (err: any) {
    console.error('generate-ad API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
