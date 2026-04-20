# Legacy manual SQL (deprecated)

Schema changes are **canonical** in the repo root under `prisma/`:

- `schema_changes.sql` — idempotent DDL (tables, columns, renames, indexes without population-dependent steps)
- `schema_population.sql` — idempotent data + backfills + FKs + `NOT NULL`

Production and dev containers apply both via `psql` + `DATABASE_URL_DIRECT` before the app starts.

The old `20260417180000_departments_catalog.sql` copy was removed to avoid drift; use the two files above.
