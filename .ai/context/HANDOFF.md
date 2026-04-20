# Cabox — Session Handoff

> **Last Updated**: 2026-04-20  
> **Session Date**: April 17, 2026 (departments); April 20, 2026 (prod DB mismatch note)

## Production incident (P2021 / missing columns)

**Symptoms:** `relation "public.Department" does not exist`, `column Product.primaryCategoryId` missing.

**Cause:** DB never received the departments DDL while the app expected the new Prisma schema.

**Fix:** Ensure **`DATABASE_URL_DIRECT`** points at Postgres (not PgBouncer transaction pool), then either **redeploy the app image** (entrypoint runs `schema_changes.sql` + `schema_population.sql` via `psql`) or run the same two files manually with `psql`. Both scripts are idempotent.

---

## Current Focus

**Departments catalog** — schema is driven by **`app/prisma/schema_changes.sql`** and **`app/prisma/schema_population.sql`** (no `prisma/migrations/`). Prod: `Dockerfile.prd` entrypoint; dev: `app/docker-entrypoint.sh`.

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

### Schema SQL (prod + dev)
- **`app/prisma/schema_changes.sql`** — idempotent DDL (Department table, renames, nullable columns, junction table shells, `OrderItem` columns).
- **`app/prisma/schema_population.sql`** — idempotent seeds + backfills + `NOT NULL` + FKs.
- **Preflight**: `app/scripts/preflight-departments-migration.sql` on a DB snapshot when unsure.
- **Deploy**: `Dockerfile.prd` and `app/docker-entrypoint.sh` run both files with **`psql "$DATABASE_URL_DIRECT"`** before the server starts.

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

1. **`DATABASE_URL_DIRECT` missing or pointing at PgBouncer (transaction)** — `psql` schema apply can fail or hang; must target Postgres directly.
2. **Sitemap 500 via Nginx** — `/sitemap.xml` may 500 through `:8080` while OK on `:3000`; check `nginx.conf` proxy for `/sitemap.xml`.
3. **IDE TS “cannot find module”** — Often false positive when TS runs at repo root; Docker/Turbopack build is source of truth.
4. **PgBouncer**: Use **`DATABASE_URL_DIRECT`** for migrations and Prisma CLI (`schema.prisma` `directUrl`).
5. **Empty plan file**: `.ai/plans/20260322_whatsapp_plan.md` still 0 bytes — populate or delete.
6. **`npm install`** may need **`--legacy-peer-deps`** (Next 16 vs Sentry peer); broken `node_modules` may require clean reinstall before `next build`.

---

## Git State

Run **`git status`** before committing schema SQL or Docker changes.

---

## Key Files (departments)

| Area | Paths |
|------|--------|
| Plan | `.ai/plans/20260417_departments.md` |
| Schema SQL | `app/prisma/schema_changes.sql`, `app/prisma/schema_population.sql` |
| Preflight | `app/scripts/preflight-departments-migration.sql` |
| Entrypoints | `Dockerfile.prd` (prod), `app/docker-entrypoint.sh` (dev) — `psql` then app |
| Schema | `app/prisma/schema.prisma` |
| Store routing | `app/src/app/[locale]/(store)/[department]/…`, `(store)/layout.tsx`, `(store)/page.tsx`, `products/page.tsx` |
| Admin | `app/src/app/admin/(protected)/departments/page.tsx`, `products/page.tsx`, `components/admin/AdminSidebar.tsx` |

---

## Atomic next steps

1. Confirm **`.env.prd`** sets **`DATABASE_URL_DIRECT`** to `postgresql://...@postgres:5432/...` (internal Docker hostname for the DB service).
2. Rebuild/restart the **prd** app image so the entrypoint runs the two SQL files.
3. Optional: run **`app/scripts/preflight-departments-migration.sql`** on a snapshot first.

---

## Previously Completed (earlier phases)

- Volume backup/restore in `bin/start.sh` (B/R menu).
- Phase 4 storefront enhancements (cart drawer, zoom, skeletons, SEO).
- Stripe/PayPal, WhatsApp order notifications, AI ads, share, order tickets, categories API.

---

## Environment

- **Branch**: `master` (verify with `git branch`)
- **Remote**: `origin` → `github.com/PiloTracer/cabox`
