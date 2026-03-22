# Cabox — Session Handoff

> **Last Updated**: 2026-03-21T21:56:00-06:00

## Current Focus

Phase 3 complete. Storefront, admin, checkout, and static pages are all implemented and running. Next work is Phase 4 (Stripe, admin order detail, category management, WhatsApp notifications, PWA).

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

## Active Files (Key Areas)

### Infrastructure
- `docker-compose.dev.yml` — full stack definition
- `.env.dev` — all env vars (contains real ADMIN credentials)
- `bin/start.sh` — orchestration script (migrate + seed + up)
- `app/prisma/schema.prisma` — 18-model Prisma schema
- `app/prisma/seed.ts` — seeds admin user + categories + sample products

### Backend / API
- `app/src/lib/prisma.ts` — Prisma singleton using `DATABASE_URL_DIRECT` (bypasses PgBouncer — **do not revert**)
- `app/src/lib/auth.ts` — NextAuth.js credentials config
- `app/src/app/api/auth/[...nextauth]/route.ts` — auth handler
- `app/src/app/api/admin/products/route.ts` — POST (create), GET (list)
- `app/src/app/api/admin/products/[id]/route.ts` — GET, PUT, DELETE (soft-archive)
- `app/src/app/api/orders/route.ts` — POST order creation, generates `CBXyyMM-XXXX` number

### Storefront (`app/src/app/[locale]/(store)/`)
- `layout.tsx` — wraps with Navbar + Footer
- `page.tsx` — home page (hero, category pills, featured products, value props)
- `products/page.tsx` — products grid with FilterBar + search
- `products/[slug]/page.tsx` — product detail (gallery, AddToCart, WhatsApp buy, related)
- `checkout/page.tsx` → `components/store/CheckoutForm.tsx` — 5 payment methods, order summary
- `orders/[orderNumber]/page.tsx` — order status with progress steps
- `pages/[slug]/page.tsx` — static pages: `envios`, `contacto`, `privacidad`, `terminos` (ES + EN)

### Admin (`app/src/app/admin/`)
- `layout.tsx` — session guard (redirects to `/admin/login` if unauth)
- `login/page.tsx` — credentials login form
- `page.tsx` — dashboard (stats + recent orders)
- `products/page.tsx` — products table (image, name, category, price, status)
- `products/new/page.tsx` → `components/admin/ProductForm.tsx` — create with auto-slug
- `products/[id]/edit/page.tsx` — edit (loads existing data into ProductForm)
- `orders/page.tsx` — orders table with status filter tabs and pagination

### Components
- `src/components/Providers.tsx` — SessionProvider wrapper
- `src/components/store/Navbar.tsx` — mobile menu + inline CartDrawer (Zustand)
- `src/components/store/Footer.tsx` — links to all static pages
- `src/components/store/ProductCard.tsx` — image, badges, price
- `src/components/store/FilterBar.tsx` — client-side category filter
- `src/components/store/AddToCartButton.tsx` — add with success state
- `src/components/store/CheckoutForm.tsx` — full checkout UI
- `src/components/admin/AdminSidebar.tsx` — nav + sign-out
- `src/components/admin/ProductForm.tsx` — shared create/edit form

### State & Design
- `src/stores/cart-store.ts` — Zustand + localStorage persistence
- `src/app/globals.css` — full design system tokens + all component CSS
- `src/messages/es.json` / `en.json` — i18n strings

## Known Issues / Important Notes

1. **PgBouncer & Prisma**: PgBouncer breaks SCRAM-SHA-256 auth with PG16. Prisma singleton (`lib/prisma.ts`) uses `DATABASE_URL_DIRECT` (direct PG connection). Do not change this without fixing PgBouncer config.
2. **NEXTAUTH_SECRET**: `.env.dev` contains a placeholder. Replace with `openssl rand -base64 32` output before production.
3. **NEXTAUTH_URL**: Set to `http://localhost:8080` (Nginx port). Must match the public-facing URL.
4. **VS Code TS errors**: IDE shows "Cannot find module 'next'" etc. — false positives because TS server runs against repo root, not `app/`. Turbopack compiles correctly inside Docker.
5. **`images` field**: Prisma JSON field can be `null`. All pages that read `product.images` must use `(product.images as string[] | null) ?? []`.
6. **Admin login credentials**: `ADMIN_EMAIL` and `ADMIN_SEED_PASSWORD` from `.env.dev`. Password hash stored in DB via seed.

## Git State

```
76cac66 (HEAD -> master, origin/master) products   ← Phase 2+3 commit
238cbaa  feat: Phase 1 — Docker scaffolding...
```

Uncommitted changes: Phase 3 additions (checkout, orders, admin product form, static pages, CSS). **User must commit before proceeding (Agent is restricted from Git Ops).**

## Atomic Next Steps (Phase 4)

1. **User Action Required:** Execute `git add . && git commit -m "feat: Phase 3 — checkout, admin CRUD, static pages"` to commit current work.
2. **Admin order detail page** — `/admin/orders/[id]/page.tsx` — view order items + update status (PATCH `/api/admin/orders/[id]`)
3. **Admin orders PATCH API** — `app/src/app/api/admin/orders/[id]/route.ts` — update status + payment status
4. **Category management** — `/admin/categories` — list + create + reorder
5. **Stripe integration** — install `stripe`, create `/api/webhooks/stripe` route, update order payment status on `payment_intent.succeeded`
6. **WhatsApp notify** — on order create, send WA message to admin via Twilio API or WAHA
7. **PWA service worker** — `next-pwa` or custom SW for offline product cache + install prompt
8. **Image upload** — Cloudflare R2 or Vercel Blob for product images (currently URL-only)
9. **Inventory variants** — `ProductVariant` model exists in schema; wire into ProductForm

## Environment

- **Active environment**: `dev`
- **Branch**: `master`
- **Remote**: `origin/master` (github.com/PiloTracer/cabox)
