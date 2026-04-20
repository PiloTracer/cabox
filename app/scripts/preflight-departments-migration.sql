-- Run against staging or a restored prod snapshot.
-- Section A: before SQL apply (legacy schema). Section B: after schema_changes + schema_population.

\set ON_ERROR_STOP on

-- ── Section A (legacy DB only; skip errors if column names already migrated) ────────
DO $$
DECLARE
  has_legacy BOOLEAN;
  orphaned INT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'categoryId'
  ) INTO has_legacy;

  IF has_legacy THEN
    EXECUTE $q$
      SELECT COUNT(*)::INT FROM "Product" p
      WHERE NOT EXISTS (SELECT 1 FROM "Category" c WHERE c."id" = p."categoryId")
    $q$ INTO orphaned;
    IF orphaned > 0 THEN
      RAISE EXCEPTION 'Migration prerequisite failed: % products reference missing categories', orphaned;
    END IF;
    RAISE NOTICE 'Legacy FK check OK (0 orphaned products)';
  ELSE
    RAISE NOTICE 'Skip legacy orphan check (categoryId column not present)';
  END IF;
END $$;

-- ── Section B (expect these after successful migration) ─────────────────────────────
SELECT 'Department slug=general exists' AS check_name,
  EXISTS (SELECT 1 FROM "Department" WHERE slug = 'general') AS ok;
