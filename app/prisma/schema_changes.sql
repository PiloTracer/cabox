-- Idempotent DDL for Cabox (production + dev). Safe to re-run.
-- Run before schema_population.sql (entrypoint runs both in order).
-- Requires: PostgreSQL, DATABASE_URL_DIRECT pointing at Postgres (not PgBouncer transaction pool).

-- ── Department table + indexes (no rows; see schema_population.sql) ───────────────
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

-- ── Legacy Product.categoryId → primaryCategoryId ─────────────────────────────────
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

-- ── Nullable department FK columns (filled in schema_population.sql) ────────────
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "primaryDepartmentId" TEXT;

ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "primaryDepartmentId" TEXT;

-- ── Junction tables (FKs added in schema_population.sql after backfill) ─────────
CREATE TABLE IF NOT EXISTS "ProductCategory" (
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("productId","categoryId")
);

CREATE INDEX IF NOT EXISTS "ProductCategory_categoryId_idx" ON "ProductCategory"("categoryId");

CREATE TABLE IF NOT EXISTS "DepartmentProduct" (
    "departmentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DepartmentProduct_pkey" PRIMARY KEY ("departmentId","productId")
);

CREATE INDEX IF NOT EXISTS "DepartmentProduct_productId_idx" ON "DepartmentProduct"("productId");

CREATE TABLE IF NOT EXISTS "DepartmentCategory" (
    "departmentId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DepartmentCategory_pkey" PRIMARY KEY ("departmentId","categoryId")
);

CREATE INDEX IF NOT EXISTS "DepartmentCategory_categoryId_idx" ON "DepartmentCategory"("categoryId");

-- ── Order line snapshot columns (additive) ───────────────────────────────────────
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "departmentSlug" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "departmentNameEs" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "departmentNameEn" TEXT;
