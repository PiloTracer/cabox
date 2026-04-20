-- Departments catalog: Product.primaryCategoryId, ProductCategory, Department*, OrderItem snapshots.
-- REQUIRED FOR PROD: copy this file to:
--   app/prisma/migrations/20260420180000_departments_catalog/migration.sql
-- (mkdir that folder; fix permissions on app/prisma/migrations if needed). Without it,
-- `prisma migrate deploy` never creates Department / renames categoryId → primaryCategoryId.
--
-- GUARANTEES FOR PRODUCTION:
-- • Runs inside PostgreSQL transaction when invoked via `prisma migrate deploy` (all-or-nothing).
-- • Guards: CREATE IF NOT EXISTS / conditional rename / INSERT dedupe — tolerate partial prior attempts.
-- • Department FK targets resolved via slug `general`, not only fixed seed ids (survives slug-only conflicts).
--
-- PRE-DEPLOY CHECKLIST (run on a restored prod snapshot before touching prod):
-- • SELECT COUNT(*) FROM "Product" WHERE "categoryId" IS NOT NULL OR "primaryCategoryId" IS NOT NULL;
-- • Ensure every Product row has a valid Category FK before migration (already enforced by legacy FK).
--
-- CERTAINTY: No migration can guarantee success unseen prod anomalies (manual DB edits, corrupt FKs).
-- If checks pass on a prod clone, the same migration yields the same outcome on prod.

-- ── 1) Department ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Department" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameEs" TEXT NOT NULL,
    "taglineEn" TEXT NOT NULL DEFAULT '',
    "taglineEs" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "heroImageUrl" TEXT,
    "logoUrl" TEXT,
    "theme" JSONB NOT NULL DEFAULT '{}',
    "navOverrideJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Department_slug_key" ON "Department"("slug");

CREATE UNIQUE INDEX IF NOT EXISTS "Department_one_default" ON "Department"("isDefault") WHERE "isDefault" = true;

CREATE INDEX IF NOT EXISTS "Department_isActive_idx" ON "Department"("isActive");

CREATE INDEX IF NOT EXISTS "Department_position_idx" ON "Department"("position");

INSERT INTO "Department" ("id","slug","nameEn","nameEs","taglineEn","taglineEs","isActive","isDefault","position","theme","createdAt","updatedAt")
VALUES
    ('dpt_seed_general', 'general', 'General', 'General', '', '', true, true, 0, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('dpt_seed_outlet', 'outlet', 'Outlet', 'Outlet', '', '', true, false, 1, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('dpt_seed_bisuteria', 'bisuteria', 'Fashion Jewelry', 'Bisutería', '', '', true, false, 2, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('dpt_seed_home', 'home', 'Home', 'Hogar', '', '', true, false, 3, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('dpt_seed_tools', 'tools', 'Tools', 'Herramientas', '', '', true, false, 4, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

-- ── 2) Rename legacy Product.categoryId → primaryCategoryId ------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'categoryId'
  ) THEN
    ALTER TABLE "Product" RENAME COLUMN "categoryId" TO "primaryCategoryId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'i' AND c.relname = 'Product_categoryId_idx'
  ) THEN
    ALTER INDEX "Product_categoryId_idx" RENAME TO "Product_primaryCategoryId_idx";
  END IF;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Product" RENAME CONSTRAINT "Product_categoryId_fkey" TO "Product_primaryCategoryId_fkey";
EXCEPTION WHEN undefined_object THEN NULL;
WHEN duplicate_object THEN NULL;
END $$;

-- ── 3) Nullable FK targets until backfilled ----------------------------------------
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "primaryDepartmentId" TEXT;

ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "primaryDepartmentId" TEXT;

UPDATE "Product"
SET "primaryDepartmentId" = (SELECT "id" FROM "Department" WHERE "slug" = 'general' LIMIT 1)
WHERE "primaryDepartmentId" IS NULL;

UPDATE "Category"
SET "primaryDepartmentId" = (SELECT "id" FROM "Department" WHERE "slug" = 'general' LIMIT 1)
WHERE "primaryDepartmentId" IS NULL;

-- ── 4) ProductCategory -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ProductCategory" (
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("productId","categoryId")
);

CREATE INDEX IF NOT EXISTS "ProductCategory_categoryId_idx" ON "ProductCategory"("categoryId");

INSERT INTO "ProductCategory" ("productId", "categoryId", "position")
SELECT p."id", p."primaryCategoryId", 0
FROM "Product" p
WHERE NOT EXISTS (
  SELECT 1 FROM "ProductCategory" pc
  WHERE pc."productId" = p."id" AND pc."categoryId" = p."primaryCategoryId"
);

-- ── 5) DepartmentProduct -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS "DepartmentProduct" (
    "departmentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DepartmentProduct_pkey" PRIMARY KEY ("departmentId","productId")
);

CREATE INDEX IF NOT EXISTS "DepartmentProduct_productId_idx" ON "DepartmentProduct"("productId");

INSERT INTO "DepartmentProduct" ("departmentId", "productId", "position")
SELECT d."id", p."id", 0
FROM "Product" p
CROSS JOIN LATERAL (SELECT "id" FROM "Department" WHERE "slug" = 'general' LIMIT 1) AS d
WHERE NOT EXISTS (
  SELECT 1 FROM "DepartmentProduct" dp
  WHERE dp."productId" = p."id" AND dp."departmentId" = d."id"
);

-- ── 6) DepartmentCategory ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS "DepartmentCategory" (
    "departmentId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DepartmentCategory_pkey" PRIMARY KEY ("departmentId","categoryId")
);

CREATE INDEX IF NOT EXISTS "DepartmentCategory_categoryId_idx" ON "DepartmentCategory"("categoryId");

INSERT INTO "DepartmentCategory" ("departmentId", "categoryId", "position")
SELECT d."id", c."id", 0
FROM "Category" c
CROSS JOIN LATERAL (SELECT "id" FROM "Department" WHERE "slug" = 'general' LIMIT 1) AS d
WHERE NOT EXISTS (
  SELECT 1 FROM "DepartmentCategory" dc
  WHERE dc."categoryId" = c."id" AND dc."departmentId" = d."id"
);

-- ── 7) NOT NULL ---------------------------------------------------------------------
ALTER TABLE "Product" ALTER COLUMN "primaryDepartmentId" SET NOT NULL;

ALTER TABLE "Category" ALTER COLUMN "primaryDepartmentId" SET NOT NULL;

-- ── 8) Foreign keys (idempotent) ---------------------------------------------------
DO $$ BEGIN
  ALTER TABLE "Product" ADD CONSTRAINT "Product_primaryDepartmentId_fkey"
    FOREIGN KEY ("primaryDepartmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Category" ADD CONSTRAINT "Category_primaryDepartmentId_fkey"
    FOREIGN KEY ("primaryDepartmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DepartmentProduct" ADD CONSTRAINT "DepartmentProduct_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DepartmentProduct" ADD CONSTRAINT "DepartmentProduct_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DepartmentCategory" ADD CONSTRAINT "DepartmentCategory_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DepartmentCategory" ADD CONSTRAINT "DepartmentCategory_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "Product_primaryDepartmentId_idx" ON "Product"("primaryDepartmentId");

CREATE INDEX IF NOT EXISTS "Category_primaryDepartmentId_idx" ON "Category"("primaryDepartmentId");

-- ── 9) Order line snapshots --------------------------------------------------------
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "departmentSlug" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "departmentNameEs" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "departmentNameEn" TEXT;
