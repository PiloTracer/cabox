# Feature Plan: Standalone Image Search & Embed
**File:** `.ai/plans/20260322_image_search_and_embed.md`  
**Author:** AI Dev Session  
**Date:** 2026-03-22  
**Status:** 🔧 In Progress

---

## Overview / Resumen

**EN:** A standalone "Search Images" button that allows the admin to search for product images independently from AI analysis. The search uses the existing product name (ES or EN) as the query. Found images are displayed in the existing gallery and **appended** to any already-added images — never replacing them.

**ES:** Un botón independiente "Buscar imágenes" que permite al administrador buscar imágenes del producto sin necesidad de ejecutar el análisis de IA completo. La búsqueda usa el nombre del producto como query. Las imágenes encontradas se muestran en la galería existente y se **agregan** a las ya existentes — nunca las reemplaza.

---

## Two Scenarios

| Scenario | Trigger | What Happens |
|----------|---------|-------------|
| **1. Full AI Analysis** | "Analizar con IA" button | AI fills ALL fields (name, desc, specs, price, images). Images auto-appended. |
| **2. Standalone Image Search** | "🔍 Buscar imágenes" button | Searches Google for images using the current product name. Appends to existing images. Does NOT modify any other field. |

---

## Architecture

### New API Endpoint

**`POST /api/admin/ai/search-images`**

- **Auth:** Admin session required
- **Input:** `{ "query": "Nike Air Max 90 shoe" }`
- **Process:** Calls `searchProductImages()` from `image-search.ts`
- **Output:** `{ "images": [ { url, title, thumb } ] }`

### Files Modified

| File | Change |
|------|--------|
| `src/app/api/admin/ai/search-images/route.ts` | **[NEW]** Standalone image search endpoint |
| `src/components/admin/ProductForm.tsx` | Add "🔍 Buscar imágenes" button in the Images card |

### UI Behavior

- Button appears in the **Imágenes** card section, next to the title
- Uses `data.nameEs` (or `data.nameEn`) as the search query
- Shows a spinner while searching
- Results appear in the same `foundImages` gallery with select/deselect thumbnails
- Clicking "Agregar" **appends** to existing images (no replacement)
- Button disabled if product name is empty

---

## Limitations

| Limitation | Notes |
|-----------|-------|
| Requires product name | Button disabled until `nameEs` or `nameEn` is filled |
| Same image source | Uses the same `googlethis` → Google CSE fallback chain |
| Rate limits | Google CSE free tier: 100/day; `googlethis` unlimited |
