# Share Button — Plan & Roadmap

**Created:** 2026-03-22  
**Status:** ✅ Implemented

---

## Goal

Add a product share button to the storefront product detail page that works correctly on all devices:

- **Mobile (iOS / Android):** invokes the native OS share sheet (WhatsApp, Telegram, Instagram, SMS, email, etc.)
- **Desktop Chrome / Edge:** invokes the browser's native share dialog
- **Unsupported browsers (older Firefox, Safari < 15):** falls back to a custom dropdown with manual share links

---

## Technical Approach: Web Share API + Fallback Dropdown

```ts
// Feature detection — only available in secure contexts (HTTPS or localhost)
if (navigator.canShare && navigator.canShare({ url, title, text })) {
  await navigator.share({ url, title, text });
} else {
  // Show fallback dropdown
}
```

### What gets shared
- **title:** Product name (locale-aware)
- **text:** Short description or tagline
- **url:** Current page URL (`window.location.href`)

---

## Component Design

### `ShareButton.tsx` — `'use client'`

A self-contained client component:

1. Detects `navigator.share` support on mount
2. **If supported:** single button → calls `navigator.share()`
3. **If NOT supported:** button toggles a custom dropdown with:
   - 🔗 **Copy Link** (copies to clipboard, shows "¡Copiado!" confirmation)
   - 💬 **WhatsApp** → `https://wa.me/?text=...`
   - 📘 **Facebook** → `https://www.facebook.com/sharer/sharer.php?u=...`
   - 🐦 **X / Twitter** → `https://twitter.com/intent/tweet?url=...`
   - ✉️ **Email** → `mailto:?subject=...&body=...`

### Props
```ts
interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;          // defaults to window.location.href
  locale?: string;       // for button label language
}
```

---

## Files

### [NEW] `app/src/components/store/ShareButton.tsx`
Client component with Web Share API + fallback dropdown.

### [MODIFY] `app/src/app/[locale]/(store)/products/[slug]/page.tsx`
Import and place `<ShareButton>` in the product actions area, below Add-to-Cart and WhatsApp buttons.

---

## UX Notes

- Button label: **"Compartir"** (es) / **"Share"** (en)
- Use a share icon (📤 or lucide `Share2`)
- Dropdown closes on outside click (`useEffect` document click listener)
- Accessible: `aria-label`, `aria-expanded`, keyboard-navigable
- No extra dependencies — pure Web APIs

---

## Verification Plan

- [ ] Test on Android Chrome → native share sheet appears
- [ ] Test on Desktop Chrome → native share dialog appears  
- [ ] Test on Firefox → fallback dropdown shows with all options
- [ ] Copy link copies the correct URL and shows confirmation
- [ ] WhatsApp/Facebook/X links open correctly
- [ ] Closes on outside click
- [ ] Works in both `es` and `en` locales
