/**
 * lib/gemini.ts — Gemini AI via native fetch (no SDK package required)
 *
 * Uses the Google Generative Language REST API directly.
 * Endpoint: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 *
 * Required env var: GEMINI_API_KEY (or GOOGLE_CLOUD_VISION_API_KEY as fallback)
 * Get a free key at: https://aistudio.google.com/app/apikey
 */

const API_KEY = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_CLOUD_VISION_API_KEY ?? '';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

export interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message: string; code: number };
}

/**
 * Call Gemini generateContent with an array of parts (text + optional images).
 * Returns the response text or throws on error.
 */
export async function generateContent(
  parts: GeminiPart[],
  model = 'gemini-2.5-flash'
): Promise<string> {
  if (!API_KEY || API_KEY.startsWith('PLACEHOLDER')) {
    throw new Error('GEMINI_API_KEY no está configurado en .env.dev');
  }

  const url = `${BASE_URL}/${model}:generateContent?key=${API_KEY}`;

  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature:     0.4,
        topK:            32,
        topP:            1,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  });

  const data = (await res.json()) as GeminiResponse;

  if (data.error) {
    throw new Error(`Gemini API error ${data.error.code}: ${data.error.message}`);
  }

  console.log('[DEBUG Gemini Raw Response Object]', JSON.stringify(data, null, 2));

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Gemini returned an empty response.');
  return text;
}
