# Cabox — Session Handoff

> **Last Updated**: 2026-04-17 (session close)  
> **Session Date**: April 17, 2026

## Current Focus

**Departments catalog** (plan: `.ai/plans/20260417_departments.md`) — implemented in application code; **database migration must be placed under Prisma migrations and applied before production can run the new schema.**

---

## Recently Completed (this session)

### Departments & storefront
- **Schema** (`app/prisma/schema.prisma`): `Department`, `DepartmentCategory`, `DepartmentProduct`, `ProductCategory`; `Product` uses `primaryCategoryId` + `primaryDepartmentId`; `Category.primaryDepartmentId`; `OrderItem` department snapshot fields.
- **Store**: Lobby home with department pills; **`[department]/layout.tsx`** (per-dept theme); **`[department]/page.tsx`** (featured + category pills); **`[department]/products/page.tsx`** (grid + filters); **`[department]/products/[slug]/page.tsx`** canonical PDP; legacy **`/products/[slug]`** redirects to canonical path.
- **`Navbar`**: Dynamic departments from DB (replaces hardcoded category links).
- **`ProductCard`**: Optional **`detailHref`** for canonical URLs.
- **Libs**: `app/src/lib/departments.ts`, `product-urls.ts`, `theme.ts`, `sync-product-catalog.ts`.
- **APIs**: Admin departments CRUD; products sync junctions; orders snapshot department on line items; public feeds/meta use department URLs.
- **Admin**: **`/admin/departments`** list + sidebar link; products list **`?filter=unclassified`** (“Solo General”) + **Department** column; categories table fixed **`_count.primaryProducts`**.
- **Sitemap** (`app/src/app/sitemap.ts`): Department homes, dept product indexes, canonical PDP URLs.

### Migration (SQL — review before prod)
- **Hardened script**: `app/prisma/manual-migrations/20260417180000_departments_catalog.sql`  
  Idempotent-style guards, slug-based General department resolution, deduped junction inserts, `ADD COLUMN IF NOT EXISTS` on `OrderItem`.
- **Preflight checks**: `app/scripts/preflight-departments-migration.sql` (run on a **prod snapshot** before deploy).
- **Deploy path**: `app/docker-entrypoint.sh` runs **`npx prisma migrate deploy`** on container start — migration only runs if it exists as **`app/prisma/migrations/<timestamp>_departments_catalog/migration.sql`**.
- **Blocker encountered**: Could not create `app/prisma/migrations/…` in-agent (**permission denied** on that tree). **Action for you**: `sudo chown` or copy the manual SQL into a new migration folder, then `prisma migrate deploy` on staging.

---

## Docker Stack (dev)

| Container        | Role        | Port (host)          |
|------------------|-------------|----------------------|
| `cabox_nginx`    | Reverse proxy | `:8080` (main entry) |
| `cabox_app`      | Next.js     | internal `:3000`     |
| `cabox_db`       | PostgreSQL  | internal `5432`      |
| `cabox_pgbouncer`| Pooling     | internal `5432`      |
| `cabox_redis`    | Cache/rate limit | internal `6379` |

**Start**: `./bin/start.sh` or `./bin/start.sh dev`  
**URLs**: Store → `http://localhost:8080/es` | Admin → `http://localhost:8080/admin`

---

## Known Issues / Blockers

1. **Prisma migration not in `prisma/migrations/`** — Production/staging will not apply departments DDL until the SQL is copied into a new migration directory and deployed.
2. **Sitemap 500 via Nginx** — `/sitemap.xml` may 500 through `:8080` while OK on `:3000`; check `nginx.conf` proxy for `/sitemap.xml`.
3. **IDE TS “cannot find module”** — Often false positive when TS runs at repo root; Docker/Turbopack build is source of truth.
4. **PgBouncer**: Use **`DATABASE_URL_DIRECT`** for migrations and Prisma CLI (`schema.prisma` `directUrl`).
5. **Empty plan file**: `.ai/plans/20260322_whatsapp_plan.md` still 0 bytes — populate or delete.
6. **`npm install`** may need **`--legacy-peer-deps`** (Next 16 vs Sentry peer); broken `node_modules` may require clean reinstall before `next build`.

---

## Git State

Run **`git status`** — do not rely on a fixed SHA here; commit when migration + ownership are resolved.

---

## Key Files (departments)

| Area | Paths |
|------|--------|
| Plan | `.ai/plans/20260417_departments.md` |
| Migration SQL | `app/prisma/manual-migrations/20260417180000_departments_catalog.sql` |
| Preflight | `app/scripts/preflight-departments-migration.sql` |
| Entrypoint | `app/docker-entrypoint.sh` (`migrate deploy` then seed) |
| Schema | `app/prisma/schema.prisma` |
| Store routing | `app/src/app/[locale]/(store)/[department]/…`, `(store)/layout.tsx`, `(store)/page.tsx`, `products/page.tsx` |
| Admin | `app/src/app/admin/(protected)/departments/page.tsx`, `products/page.tsx`, `components/admin/AdminSidebar.tsx` |

---

## Atomic Next Steps (tomorrow)

1. **Fix ownership** on `app/prisma/migrations/` if needed; **copy** hardened SQL into `app/prisma/migrations/20260417200000_departments_catalog/migration.sql` (or `prisma migrate dev` name after folder exists).
2. Run **`app/scripts/preflight-departments-migration.sql`** on a DB snapshot; then **`npx prisma migrate deploy`** (or compose exec) on staging.
3. **`prisma generate`** + **`next build`** in app container; fix any remaining type errors.
4. Deploy **app + migration together** in one release.
5. (Optional) Stop masking seed failures in prod entrypoint — evaluate whether **`prisma db seed`** should run every container start (`docker-entrypoint.sh` currently `seed … || true`).

---

## Previously Completed (earlier phases)

- Volume backup/restore in `bin/start.sh` (B/R menu).
- Phase 4 storefront enhancements (cart drawer, zoom, skeletons, SEO).
- Stripe/PayPal, WhatsApp order notifications, AI ads, share, order tickets, categories API.

---

## Environment

- **Branch**: `master` (verify with `git branch`)
- **Remote**: `origin` → `github.com/PiloTracer/cabox`
