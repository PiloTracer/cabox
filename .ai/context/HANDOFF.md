# Cabox — Session Handoff

> **Last Updated**: 2026-04-17T15:45:00-06:00
> **Session Date**: April 17, 2026

## Current Focus

Phase 5 work in progress. Recent major additions:

### Recently Completed (April 2026)
1. ✅ **Volume-level Backup/Restore** — Added to `bin/start.sh` (B/R menu options)
   - Cold backup of PostgreSQL data directory
   - Dev/Prd environment support with correct volume names
   - PG_VERSION validation
   - Automatic service stop/start with error recovery

### Previously Completed (March 2026)
- ✅ Phase 4: Storefront Professional Enhancements (cart drawer, image zoom, skeletons, SEO)
- ✅ WhatsApp notifications on order creation
- ✅ Stripe checkout + webhook
- ✅ PayPal webhook
- ✅ AI ad generator (Gemini)
- ✅ Share button
- ✅ Order ticket system (payment proof upload)
- ✅ Categories API (CRUD endpoints)

## Docker Stack (dev)

| Container        | Status      | Port (host)         |
|------------------|-------------|---------------------|
| `cabox_nginx`    | Up          | `:8080` (main entry)|
| `cabox_app`      | Up          | internal `:3000`    |
| `cabox_db`       | Up (healthy)| internal `5432`     |
| `cabox_pgbouncer`| Up          | internal `5432`     |
| `cabox_redis`    | Up          | internal `6379`     |

**Start command**: `./bin/start.sh` (auto-detects env) or `./bin/start.sh dev`
**Backup/Restore**: Select **B** or **R** in the menu
**URLs**: Store → `http://localhost:8080/es` | Admin → `http://localhost:8080/admin`

## Uncommitted Changes

Check `git status` for current state. Previous session (March 22) had storefront enhancements.

### Key Files Modified Recently
| File | Change |
|------|--------|
| `bin/start.sh` | Added backup/restore functions (B/R menu options) |
| `.gitignore` | Added `backup/` directory |
| `templates/env.dev.template` | Aligned structure with `.env.example` |
| `.env.example` | Added comment line for alignment |
| `.ai/context/*.md` | Updated with current feature status |

## Known Issues / Blockers

1. **Sitemap 500 in dev**: `http://localhost:8080/sitemap.xml` returns 500. Likely a Nginx proxy issue — the route works inside the Docker container on port 3000 but fails through the Nginx reverse proxy on 8080. Needs investigation of `nginx.conf` to ensure `/sitemap.xml` is properly forwarded.
2. **VS Code TS lint errors**: Persistent false-positive "Cannot find module" errors because the IDE TS server runs against repo root, not inside Docker. Turbopack compiles correctly inside Docker.
3. **PgBouncer & Prisma**: Prisma singleton uses `DATABASE_URL_DIRECT` (bypasses PgBouncer). Do not change.
4. **Empty WhatsApp Plan**: `.ai/plans/20260322_whatsapp_plan.md` exists but is 0 bytes — should be populated or removed.
5. **PWA Service Worker**: `@ducanh2912/next-pwa` is installed but service worker configuration needs verification.
6. **Admin Categories Page**: API exists at `/api/admin/categories` but the admin page needs verification — sidebar link exists in `AdminSidebar.tsx`.

## Git State

Check current state with `git status`. Previous commit:
```
bd44e41 (HEAD -> master, origin/master) promotional material is saved
```

**Pending changes**: Context files updated, backup/restore added to `bin/start.sh`, env templates aligned.

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

1. **Fix or Remove Empty Plan**: Populate `.ai/plans/20260322_whatsapp_plan.md` or delete it
2. **Verify Admin Categories Page**: Ensure `/admin/categories` page exists and works (API is ready)
3. **Complete PWA Configuration**: Verify service worker and manifest configuration
4. **Fix Sitemap 500**: Investigate Nginx config for `/sitemap.xml` proxy pass
5. **Test Backup/Restore**: Run a test backup (B) and verify restore (R) works correctly
6. **Future: StripeConnect** — payouts for marketplace (if needed)
7. **Future: Inventory variants UI** — `ProductVariant` model exists; wire into ProductForm

## Environment

- **Active environment**: `dev`
- **Branch**: `master`
- **Remote**: `origin/master` (github.com/PiloTracer/cabox)
