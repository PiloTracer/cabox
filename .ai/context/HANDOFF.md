# Cabox — Session Handoff

> **Last Updated**: 2026-03-22T21:36:00-06:00
> **Session Date**: March 22, 2026

## Current Focus

Phase 4 work completed today. All 5 Storefront Professional Enhancements are implemented:
1. ✅ Slide-out Cart Drawer (Zustand global state)
2. ✅ Image Zoom (Desktop magnifier + Mobile lightbox)
3. ✅ Skeleton Loaders (loading.tsx for products grid + detail)
4. ✅ JSON-LD Schema Markup (Product + Organization)
5. ✅ Dynamic Sitemap & Robots.txt

Earlier in session: fixed order checkout API, admin order detail page, AI ad generator with Gemini, share button, promotional media section, WhatsApp text ads always including URL.

## Docker Stack (dev)

| Container        | Status      | Port (host)         |
|------------------|-------------|---------------------|
| `cabox_nginx`    | Up          | `:8080` (main entry)|
| `cabox_app`      | Up          | internal `:3000`    |
| `cabox_db`       | Up (healthy)| internal `5432`     |
| `cabox_pgbouncer`| Up          | internal `5432`     |
| `cabox_redis`    | Up          | internal `6379`     |

**Start command**: `./bin/start.sh dev`
**URLs**: Store → `http://localhost:8080/es` | Admin → `http://localhost:8080/admin`

## Uncommitted Changes (5 Modified + 7 New)

### Modified Files
| File | Change |
|------|--------|
| `app/src/app/[locale]/(store)/layout.tsx` | Added Organization JSON-LD + CartDrawer import |
| `app/src/app/[locale]/(store)/products/[slug]/page.tsx` | Added Product JSON-LD schema |
| `app/src/components/store/Navbar.tsx` | Removed inline CartDrawer, uses global `openCart` from Zustand |
| `app/src/components/store/ProductGallery.tsx` | Added hover magnifier (2x zoom) + fullscreen lightbox modal |
| `app/src/stores/cart-store.ts` | Added `isCartOpen`, `openCart`, `closeCart` state + actions |

### New Files
| File | Purpose |
|------|---------|
| `app/src/components/store/CartDrawer.tsx` | Global slide-out cart drawer (175 lines) |
| `app/src/components/store/ProductCardSkeleton.tsx` | Reusable skeleton for product cards |
| `app/src/app/[locale]/(store)/products/loading.tsx` | Skeleton for products grid page |
| `app/src/app/[locale]/(store)/products/[slug]/loading.tsx` | Skeleton for product detail page |
| `app/src/app/sitemap.ts` | Dynamic sitemap querying Prisma for active products |
| `app/src/app/robots.ts` | Blocks `/admin/` and `/api/`, broadcasts sitemap URL |
| `.ai/plans/20260322_storefront_enhancements.md` | Enhancement plan doc |

## Known Issues / Blockers

1. **Sitemap 500 in dev**: `http://localhost:8080/sitemap.xml` returns 500. Likely a Nginx proxy issue — the route works inside the Docker container on port 3000 but fails through the Nginx reverse proxy on 8080. Needs investigation of `nginx.conf` to ensure `/sitemap.xml` is properly forwarded.
2. **VS Code TS lint errors**: Persistent false-positive "Cannot find module" errors because the IDE TS server runs against repo root, not inside Docker. Turbopack compiles correctly inside Docker.
3. **PgBouncer & Prisma**: Prisma singleton uses `DATABASE_URL_DIRECT` (bypasses PgBouncer). Do not change.
4. **CartDrawer i18n**: Uses namespace `'cart'` — must match `es.json` / `en.json` message keys.

## Git State

```
bd44e41 (HEAD -> master, origin/master) promotional material is saved
```

**User must commit**: `git add . && git commit -m "feat: storefront enhancements — cart drawer, image zoom, skeletons, SEO"`

## Active Files (Key Areas)

### Infrastructure
- `docker-compose.dev.yml` — full stack definition
- `.env.dev` — all env vars (contains real ADMIN credentials)
- `bin/start.sh` — orchestration script (migrate + seed + up)
- `app/prisma/schema.prisma` — 18-model Prisma schema
- `app/prisma/seed.ts` — seeds admin user + categories + sample products

### Backend / API
- `app/src/lib/prisma.ts` — Prisma singleton using `DATABASE_URL_DIRECT`
- `app/src/lib/auth.ts` — NextAuth.js credentials config
- `app/src/app/api/orders/route.ts` — POST order creation
- `app/src/app/api/admin/orders/[id]/route.ts` — GET, PATCH (status updates)
- `app/src/app/api/admin/products/generate-ad/route.ts` — Gemini AI ad generation

### Storefront (`app/src/app/[locale]/(store)/`)
- `layout.tsx` — Navbar + Footer + CartDrawer + Organization JSON-LD
- `page.tsx` — home page (hero, category pills, featured products)
- `products/page.tsx` — products grid with FilterBar + search
- `products/loading.tsx` — skeleton loader (NEW)
- `products/[slug]/page.tsx` — product detail (gallery, zoom, AddToCart, WhatsApp, share, promo media, JSON-LD)
- `products/[slug]/loading.tsx` — skeleton loader (NEW)
- `checkout/page.tsx` — 5 payment methods, order summary
- `orders/[orderNumber]/page.tsx` — order status with progress steps

### Admin (`app/src/app/admin/`)
- `login/page.tsx` — credentials login form
- `page.tsx` — dashboard (stats + recent orders)
- `products/page.tsx` — products table
- `products/new/page.tsx` / `products/[id]/edit/page.tsx` — ProductForm with AI ad generator
- `orders/page.tsx` — orders table with status filter tabs
- `orders/[id]/page.tsx` — order detail with status management
- `settings/page.tsx` — store config with tabbed UI

### Components (key ones modified today)
- `CartDrawer.tsx` — Global offcanvas cart drawer (Zustand-driven) (NEW)
- `Navbar.tsx` — Now uses `openCart` from global store (no inline cart)
- `ProductGallery.tsx` — Hover magnifier + lightbox modal
- `ProductCardSkeleton.tsx` — Reusable skeleton (NEW)
- `ShareButton.tsx` — Web Share API + clipboard fallback
- `AddToCartButton.tsx` — triggers cart drawer via `addItem`

### State & Design
- `src/stores/cart-store.ts` — Zustand + localStorage + `isCartOpen` UI state
- `src/app/globals.css` — full design system tokens + all component CSS (1016 lines)
- `src/messages/es.json` / `en.json` — i18n strings (include `cart` namespace)

### SEO
- `src/app/sitemap.ts` — Dynamic sitemap (products + categories + both locales) (NEW)
- `src/app/robots.ts` — Blocks `/admin` + `/api`, points to sitemap (NEW)

## Atomic Next Steps

1. **User Action**: Commit uncommitted changes
2. **Fix Sitemap 500**: Investigate Nginx config for `/sitemap.xml` proxy pass
3. **Category management** — `/admin/categories` — list + create + reorder
4. **Stripe integration** — install `stripe`, webhook route, payment flow
5. **WhatsApp notifications** — on order create, send WA to admin
6. **PWA service worker** — offline product cache + install prompt
7. **Image upload** — Cloudflare R2 / Vercel Blob for product images
8. **Inventory variants** — `ProductVariant` model exists; wire into ProductForm

## Environment

- **Active environment**: `dev`
- **Branch**: `master`
- **Remote**: `origin/master` (github.com/PiloTracer/cabox)
