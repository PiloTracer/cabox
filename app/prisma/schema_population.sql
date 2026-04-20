-- Idempotent data + finishing constraints. Run after schema_changes.sql.
-- Requires: Department table exists; Product has primaryCategoryId (renamed from categoryId).

-- ── Seed departments ───────────────────────────────────────────────────────────────
INSERT INTO "Department" ("id","slug","nameEn","nameEs","taglineEn","taglineEs","isActive","isDefault","position","theme","createdAt","updatedAt")
VALUES
    ('dpt_seed_general', 'general', 'General', 'General', '', '', true, true, 0, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('dpt_seed_outlet', 'outlet', 'Outlet', 'Outlet', '', '', true, false, 1, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('dpt_seed_bisuteria', 'bisuteria', 'Fashion Jewelry', 'Bisutería', '', '', true, false, 2, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('dpt_seed_home', 'home', 'Home', 'Hogar', '', '', true, false, 3, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('dpt_seed_tools', 'tools', 'Tools', 'Herramientas', '', '', true, false, 4, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

-- ── Backfill primary department (General) ─────────────────────────────────────────
UPDATE "Product"
SET "primaryDepartmentId" = (SELECT "id" FROM "Department" WHERE "slug" = 'general' LIMIT 1)
WHERE "primaryDepartmentId" IS NULL;

UPDATE "Category"
SET "primaryDepartmentId" = (SELECT "id" FROM "Department" WHERE "slug" = 'general' LIMIT 1)
WHERE "primaryDepartmentId" IS NULL;

-- ── Junction backfills ───────────────────────────────────────────────────────────
INSERT INTO "ProductCategory" ("productId", "categoryId", "position")
SELECT p."id", p."primaryCategoryId", 0
FROM "Product" p
WHERE NOT EXISTS (
  SELECT 1 FROM "ProductCategory" pc
  WHERE pc."productId" = p."id" AND pc."categoryId" = p."primaryCategoryId"
);

INSERT INTO "DepartmentProduct" ("departmentId", "productId", "position")
SELECT d."id", p."id", 0
FROM "Product" p
CROSS JOIN LATERAL (SELECT "id" FROM "Department" WHERE "slug" = 'general' LIMIT 1) AS d
WHERE NOT EXISTS (
  SELECT 1 FROM "DepartmentProduct" dp
  WHERE dp."productId" = p."id" AND dp."departmentId" = d."id"
);

INSERT INTO "DepartmentCategory" ("departmentId", "categoryId", "position")
SELECT d."id", c."id", 0
FROM "Category" c
CROSS JOIN LATERAL (SELECT "id" FROM "Department" WHERE "slug" = 'general' LIMIT 1) AS d
WHERE NOT EXISTS (
  SELECT 1 FROM "DepartmentCategory" dc
  WHERE dc."categoryId" = c."id" AND dc."departmentId" = d."id"
);

-- ── NOT NULL (after backfill) ─────────────────────────────────────────────────────
ALTER TABLE "Product" ALTER COLUMN "primaryDepartmentId" SET NOT NULL;

ALTER TABLE "Category" ALTER COLUMN "primaryDepartmentId" SET NOT NULL;

-- ── Foreign keys (idempotent) ───────────────────────────────────────────────────
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
