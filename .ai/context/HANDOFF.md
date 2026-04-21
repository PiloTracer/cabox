# Cabox — Session handoff

> **Last updated**: 2026-04-20

## Now

**Departments** — code and Prisma schema are in repo; **database** must match via idempotent SQL run at app startup (or manual `psql`).

## Production issue (P2021 / missing columns)

**Symptoms:** `relation "public.Department" does not exist`, missing `Product.primaryCategoryId`, etc.

**Cause:** App expects new Prisma schema; Postgres never ran the departments DDL/DML.

**Fix:** Set **`DATABASE_URL_DIRECT`** to Postgres (**not** PgBouncer transaction pool). Redeploy the app image so the entrypoint runs **`app/prisma/schema_changes.sql`** then **`app/prisma/schema_population.sql`**, or run both with `psql` yourself (scripts are idempotent).

## Atomic next steps

1. Confirm **`.env.prd`** has **`DATABASE_URL_DIRECT`** → `postgresql://...@postgres:5432/...` (internal DB service).  
2. Rebuild/restart the **prd** app so the entrypoint applies both SQL files.  
3. Optional: **`app/scripts/preflight-departments-migration.sql`** on a snapshot first.

## Pointers (single source of detail)

| Topic | File |
|--------|------|
| Agent contract (safety, bootstrap) | `.cursor/rules/rules.mdc` |
| Product, stack, Docker, API security invariants | `.cursor/rules/rules_context.mdc` |
| Departments plan | `.ai/plans/20260417_departments.md` |
| Schema SQL | `app/prisma/schema_changes.sql`, `app/prisma/schema_population.sql` |
| Prod vs dev entrypoint | `Dockerfile.prd`, `app/docker-entrypoint.sh` |

## Known issues

1. **`DATABASE_URL_DIRECT`** wrong or missing — schema apply fails or misbehaves.  
2. **`/sitemap.xml`** may 500 via Nginx `:8080` while `:3000` works — check `nginx` proxy for that path.  
3. **IDE TypeScript** “cannot find module” at repo root — often false positive; Docker/build is truth.  
4. **`.ai/plans/20260322_whatsapp_plan.md`** is empty — populate or remove.  
5. **`npm install`** may need **`--legacy-peer-deps`**; broken `node_modules` may need clean reinstall before `next build`.

## Repo

- **Remote**: `origin` → `github.com/PiloTracer/cabox`  
- **Branch**: verify with `git branch` (often `master`)
