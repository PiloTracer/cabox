# Feature Plan: AI-Powered Image Upload → Product Auto-Fill
**File:** `.ai/plans/20260322_upload_image.md`
**Author:** AI Dev Session  
**Date:** 2026-03-22  
**Status:** ✅ Implemented

---

## Overview / Resumen

**EN:** Admin uploads a product photo → AI identifies the product → automatically fills all form fields (names, descriptions, specs, SKU, slug, category, price) in both English and Spanish → Google CSE finds illustrative product images → user reviews and edits everything (especially price) before saving.

**ES:** El administrador sube una foto → la IA identifica el producto → rellena automáticamente todos los campos del formulario (nombres, descripciones, especificaciones, SKU, slug, categoría, precio) en español e inglés → Google CSE busca imágenes ilustrativas → el usuario revisa y edita todo (especialmente el precio) antes de guardar.

---

## User Flow / Flujo de Usuario

```
1. Admin opens /admin/products/new (or /edit)
2. Drag-and-drop or click to upload a product photo
3. Click "Analizar con IA" button
4. Gemini 1.5 Flash analyzes the image and returns:
   - Product names (ES + EN)
   - Descriptions (ES + EN, 2–3 paragraphs each)
   - Technical specs (ES + EN)
   - Category suggestion
   - SKU + URL slug
   - Suggested CRC price + compare-at price
   - Confidence level: high / medium / low
5. Simultaneously, Google CSE searches for product images
6. Form auto-fills with all AI data
   - All AI-filled fields get a ✨ IA badge
   - Price card highlighted with "Sugerido por IA — edita a tu gusto"
7. Found images shown as clickable thumbnails — user selects which to keep
8. User edits any field (price is always editable, input is large and prominent)
9. User clicks "Guardar" → product saved
```

---

## Architecture / Arquitectura

### Files Created / Archivos Creados

| File | Purpose |
|------|---------|
| `src/lib/gemini.ts` | Gemini AI client singleton |
| `src/lib/image-search.ts` | Google CSE image search wrapper |
| `src/app/api/admin/ai/analyze-product/route.ts` | Main AI analysis API endpoint |
| `src/components/admin/ProductForm.tsx` | Full form rewrite with AI panel |

### API Endpoint

**`POST /api/admin/ai/analyze-product`**

- **Auth:** Admin session required
- **Input:** `multipart/form-data` with `image` field (File, max 10 MB)
- **Process:**
  1. Converts image → base64
  2. Sends to Gemini 1.5 Flash with detailed bilingual prompt
  3. Parses JSON response
  4. Runs Google CSE image search in parallel
- **Output:**

```json
{
  "nameEs": "Bolso de Cuero Artesanal",
  "nameEn": "Artisan Leather Bag",
  "descriptionEs": "...",
  "descriptionEn": "...",
  "specsEs": "Material: Cuero genuino\nDimensiones: 35×25×12 cm\nCierre: Cremallera YKK",
  "specsEn": "Material: Genuine leather\nDimensions: 35×25×12 cm\nClosure: YKK zipper",
  "category": "Accesorios",
  "suggestedPriceCRC": 85000,
  "suggestedCompareAtPriceCRC": 105000,
  "sku": "CBX-A-001",
  "slug": "artisan-leather-bag",
  "featured": false,
  "confidence": "high",
  "images": [
    { "url": "https://...", "title": "...", "thumb": "https://..." }
  ]
}
```

---

## Required Environment Variables / Variables de Entorno Requeridas

Add to `.env.dev`:

```env
# ── Google Gemini AI (for image analysis + product fill) ──
# Get your key at: https://aistudio.google.com/app/apikey
# The same key works for Vision, Gemini, and Custom Search
GEMINI_API_KEY="AIza..."

# ── Google Custom Search (for finding product images) ──────
# Step 1: Create a Custom Search Engine at https://cse.google.com
#   - Set to search the entire web
#   - Enable "Image search" in CSE settings
#   - Copy the Search Engine ID (cx)
# Step 2: Enable "Custom Search API" in Google Cloud Console
#   (same project as your API key)
GOOGLE_CSE_API_KEY="AIza..."          # Same key as GEMINI_API_KEY if in same GCP project
GOOGLE_CSE_SEARCH_ENGINE_ID="abc123..." # Your cx value from CSE dashboard
```

### How to Get the Keys / Cómo Obtener las Claves

#### GEMINI_API_KEY
1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **"Create API key"**
3. Select or create a Google Cloud project
4. Copy the key → paste into `.env.dev`
5. Restart: `./bin/start.sh dev restart`

#### Google CSE (Image Search)
1. Go to [https://cse.google.com](https://cse.google.com)
2. Click **"Add"** → Name it "Cabox Image Search"
3. Under "Sites to search" → select **"Search the entire web"**
4. After creation → go to **Edit search engine → Image search → Enable**
5. Copy **Search engine ID (cx)** → paste as `GOOGLE_CSE_SEARCH_ENGINE_ID`
6. Go to [Google Cloud Console](https://console.cloud.google.com/apis/library/customsearch.googleapis.com) → Enable **Custom Search API**
7. Use the same API key (or create one in the same project)

> **Note:** Google CSE free tier gives **100 queries/day**. For higher volume, enable billing ($5/1000 queries).

---

## AI Prompt Design / Diseño del Prompt

The Gemini prompt is designed to:
- Return **strict JSON only** (no markdown, no explanation)
- Generate **bilingual output** (ES + EN) for every text field
- Suggest **CRC-appropriate prices** (not US market prices)
- Generate **technical specs** (material, dimensions, closure, etc.)
- Assign a **confidence level** so the UI can warn when uncertain

---

## UI Behavior / Comportamiento de la UI

| State | What the user sees |
|-------|--------------------|
| Initial | Dashed drop zone with upload icon |
| File selected | Thumbnail preview + "Analizar con IA" button |
| Analyzing | Spinner + "🤖 Analizando producto con IA…" |
| Done | Green check + confidence level + editable form |
| Error | Red error message + "Reintentar" button |

### Image Gallery
- Found images appear as a horizontal scrolling row of thumbnails
- Each thumbnail has a checkbox to select/deselect
- Selected images are appended to the Images URLs textarea
- User can remove any image after selection using individual ✕ buttons

### Two Image Sourcing Scenarios
| Scenario | Trigger | Behavior |
|----------|---------|----------|
| 1. Full AI | "Analizar con IA" button | AI fills ALL fields + searches images via `googlethis` → Google CSE fallback |
| 2. Standalone | "🔍 Buscar imágenes" button | Calls `POST /api/admin/ai/search-images` with product name. Appends images, does NOT modify other fields. |

> **See also:** `.ai/plans/20260322_image_search_and_embed.md` for detailed standalone image search documentation.

### Price UX
- Price field is **always editable** — never readonly
- AI suggestion shown with "✨ Sugerido por IA — edita a tu gusto" label
- Price card gets a subtle primary-color border glow when AI has filled it
- Currency symbol (₡/$ ) shown as a prefix inside the input

---

## Limitations / Limitaciones

| Limitation | Notes |
|------------|-------|
| Image size | Max 10 MB (Gemini limit is 20 MB, but we cap at 10) |
| Image types | JPG, PNG, WEBP |
| CSE free quota | 100 searches/day free |
| Price accuracy | AI estimates — always review before publishing |
| Image copyright | CSE filters for CC-licensed images but verify before use |
| No direct upload | Images are found as URLs; Supabase Storage upload is a future enhancement |

---

## Extension: Multi-Image Upload, Paste & AI Iteration

**Date:** 2026-03-25  
**Status:** ✅ Implemented  

> [!NOTE]
> This section extends the original plan above. The core AI analysis and image search remain unchanged — the extension enriches them with additional input.

### New Capabilities

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Clipboard paste** | `Ctrl+V` / `Cmd+V` an image anywhere on the form → appears in the Imágenes gallery |
| 2 | **Multi-file upload** | New upload zone in the Imágenes card accepts multiple files (drag/drop or click) |
| 3 | **Unified gallery** | Uploaded (local) images and found (CSE) images display together in the same gallery |
| 4 | **AI iterates uploads** | "Analizar con IA" sends **all** uploaded images to Gemini, not just the single drop zone image — richer identification and better image search results |

### User Flow (Extended)

```
1. Admin opens /admin/products/new (or /edit)
2. (Option A) Paste image from clipboard → thumbnail appears in Imágenes section
   (Option B) Drag/drop or click in Imágenes upload zone → select multiple files
   (Option C) Drag/drop single photo in AI panel (unchanged)
3. Click "Analizar con IA"
   → AI receives the AI panel image PLUS any additional uploaded/pasted images
   → Gemini analyzes all images together for richer product identification
   → Google CSE uses the identified product for image search (unchanged)
4. Form auto-fills with AI data (unchanged)
5. Found images + uploaded images shown together in gallery
6. User selects which images to keep, reorders, sets primary
7. User clicks "Guardar" → product saved with all selected images
```

### Architecture / Technical Design

#### Files Modified

| File | Change |
|------|--------|
| `src/components/admin/ProductForm.tsx` | Add `onPaste` handler, multi-file upload zone, `uploadedFiles` state, enhanced `runAIAnalysis()` |
| `src/app/api/admin/ai/analyze-product/route.ts` | Accept multiple image fields in FormData, send all to Gemini |
| `src/app/api/admin/products/route.ts` | Relax image validation: `z.string().url()` → `z.string().min(1)` (accept data URLs) |
| `src/app/api/admin/products/[id]/route.ts` | Same validation change |

#### ProductForm.tsx Changes

**New state:**

```typescript
const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
```

**Paste handler** (on top-level container):

```typescript
const onPaste = useCallback(async (e: React.ClipboardEvent) => {
  const items = Array.from(e.clipboardData.items);
  const imageItems = items.filter(item => item.type.startsWith('image/'));
  if (imageItems.length === 0) return;
  e.preventDefault();

  for (const item of imageItems) {
    const file = item.getAsFile();
    if (!file) continue;
    const dataUrl = await fileToDataUrl(file);
    setData(d => ({
      ...d,
      images: d.images ? `${d.images}\n${dataUrl}` : dataUrl,
    }));
    setUploadedFiles(prev => [...prev, file]);
  }
}, []);
```

**Multi-file upload zone** (in Imágenes card, above found images):

```typescript
<div
  onClick={() => multiFileRef.current?.click()}
  onDrop={onMultiDrop}
  onDragOver={(e) => { e.preventDefault(); }}
  style={{ /* dashed border drop zone styling */ }}
>
  <Upload size={20} />
  <p>Arrastra imágenes aquí o haz clic para subir</p>
  <p>Puedes subir varias a la vez · También puedes pegar con Ctrl+V</p>
</div>
<input ref={multiFileRef} type="file" multiple accept="image/*"
  onChange={handleMultiFiles} style={{ display: 'none' }} />
```

**Enhanced AI analysis:**

```typescript
const runAIAnalysis = async () => {
  if (!aiFile) return;
  setAIStatus('analyzing');

  const fd = new FormData();
  fd.append('image', aiFile); // Primary image (unchanged)
  
  // Append additional uploaded images for richer analysis
  uploadedFiles.forEach((file, i) => {
    fd.append(`additionalImage`, file);
  });

  const res = await fetch('/api/admin/ai/analyze-product', { method: 'POST', body: fd });
  // ... rest unchanged
};
```

**Helper function:**

```typescript
const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
```

#### API: analyze-product/route.ts Changes

```typescript
// Current: single image
const image = formData.get('image') as File;

// Extended: primary + additional images
const primaryImage = formData.get('image') as File;
const additionalImages = formData.getAll('additionalImage') as File[];
const allImages = [primaryImage, ...additionalImages].filter(Boolean);

// Convert all to base64 and include in Gemini prompt
const imagePartsForGemini = await Promise.all(
  allImages.map(async (img) => ({
    inlineData: {
      data: Buffer.from(await img.arrayBuffer()).toString('base64'),
      mimeType: img.type,
    },
  }))
);
```

Gemini prompt addition:
```
"I'm providing {N} product photos. Analyze all of them together to 
identify the product with maximum accuracy. Use all visual cues across 
the images to generate the most complete and detailed response."
```

#### API Validation Changes

Both `route.ts` files change:
```diff
- images: z.array(z.string().url()).default([]),
+ images: z.array(z.string().min(1)).default([]),
```

This accepts both regular URLs and `data:image/...;base64,...` strings.

> [!WARNING]
> Data URLs increase database row size. Acceptable for dev/MVP. Wire up Supabase Storage upload before production launch.

### Verification (Manual)

1. **Paste test**: Copy image → `Ctrl+V` on form → appears in Imágenes list
2. **Multi-upload test**: Click upload zone → select 3+ files → all appear in list
3. **AI + uploads test**: Upload 2 images → drop 1 in AI zone → "Analizar con IA" → verify all 3 sent to API (check browser DevTools network tab, FormData)
4. **Save test**: Create product with mixed uploaded + found images → verify save succeeds
5. **Edit test**: Re-open saved product → verify all images display correctly

---

## Future Enhancements / Mejoras Futuras

- [ ] Upload images to Supabase Storage (replace data URLs with hosted URLs)
- [ ] Perplexity API fallback for better pricing research
- [ ] Re-analyze button on edit page to refresh AI suggestions
- [ ] Stripe price sync after admin confirms price
