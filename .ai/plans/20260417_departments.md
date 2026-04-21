# Cabox — Departments (Above Categories)

> **Plan date**: 2026-04-17
> **Status**: DRAFT (design & migration plan, no code yet)
> **Related**: `.ai/plans/20260321_pwa_ecommerce_plan.md`, `.cursor/rules/rules_context.mdc`,
> `app/prisma/schema.prisma`

---

## 1. Goal

Introduce a new top-level concept, **Department**, that sits **above** `Category`.
Each department behaves like a distinct storefront (its own color skin, can
override some UI styles / hero / nav) while sharing the same single backend,
single admin, single order & payment pipeline, and single customer base.

Non-goals:

- Not building a separate app per department.
- Not forking schemas, migrations, or deploys per department.
- Not changing how orders, payments, or invoices work.

---

## 2. Current State (audit)

- `schema.prisma` — `Category` is top-level with self-referencing
  `parentId`/`children`. `Product.categoryId` is **required** (1-to-1 product →
  primary category; many products in a category).
- Storefront routes: `/{locale}/products?cat=<slug>` (flat, single-store).
- Home page hardcodes category pills (`mujeres`, `hombres`, `accesorios`).
- Theme tokens live in `app/src/app/globals.css` under `:root` (brand palette,
  shadows, radii). No per-tenant theming today.
- Admin CRUD exists for Category, Product, Promotion, Coupon, Settings.
- `StoreSettings` singleton holds one `themeColor`, one `logoUrl`, one
  `storeName`, one `storeTagline`.

So today Cabox is a **single store, flat category list**. Everything below
assumes we keep one DB, one deploy, one admin, one cart/checkout.

---

## 3. Key design decisions (with rationale)

### 3.1 Multiplicity between Product / Category / Department

| Relationship                 | Recommended cardinality | Junction table | Primary pointer |
|------------------------------|------------------------|----------------|-----------------|
| `Product` ↔ `Category`       | **Many-to-many**       | `ProductCategory` | `Product.primaryCategoryId` (required) |
| `Product` ↔ `Department`     | **Many-to-many**       | `DepartmentProduct` | `Product.primaryDepartmentId` (required) |
| `Category` ↔ `Department`    | **Many-to-many**       | `DepartmentCategory` | `Category.primaryDepartmentId` (required) |

**Why many-to-many with an explicit primary** (industry-standard pattern used
by Shopify, BigCommerce, WooCommerce):

1. **Real-world needs:** Fashion items legitimately live in multiple buckets
   ("Linen shirts" + "Summer collection"; a unisex belt in both *Women* and
   *Men* departments; shoes appearing under both departments with different
   themes). Forcing single category/department creates admin duplication and
   inventory drift — the worst case in commerce.
2. **But URLs, breadcrumbs, canonical SEO, and sitemap generation need ONE
   truth.** That is what `primary*Id` provides:
   - Canonical URL: `/es/{primaryDepartment.slug}/{primaryCategory.slug}/{product.slug}`
   - `<link rel="canonical">` always points there, even if the product is
     reachable under a secondary department/category path.
   - Prevents Google duplicate-content penalties.
3. **Backward compatibility:** Every existing product already has
   `categoryId` → that value becomes `primaryCategoryId`. Every existing product
   is migrated into one default department ("General") → that becomes
   `primaryDepartmentId`. No data migration loss, no breaking change for the
   storefront.

### 3.2 How to model per-department theme & style

Option A — **JSON `theme` on Department row** (recommended)

```
theme: {
  primary:    "#8B5E3C",
  primaryDark:"#6B4226",
  accent:     "#C75B7A",
  bg:         "#FAF3EB",
  bgCard:     "#FFFFFF",
  text:       "#3A2A1A",
  textMuted:  "#8A7A6A",
  border:     "#E8D9C8",
  logoUrl:    "/logo.png",       // optional override
  heroImageUrl:"/cabox_hero_transp.png",
  displayFont:"Playfair Display",// optional
  bodyFont:   "Inter",           // optional
  classOverride: "theme-luxe"    // optional — adds body class for CSS escape hatch
}
```

Pros: one row = one theme; easy to edit in admin; zero schema churn when adding
tokens; consumed as `<style>` injection in the department layout.

Option B — separate `DepartmentTheme` row with typed columns: over-engineered
for < 20 tokens. **Reject.**

Option C — Tailwind theme per department via `tailwind.config` splits: requires
build-time knowledge of departments. **Reject** — departments must be fully
admin-manageable at runtime.

**Decision:** Option A. Plus a tiny `safe color` validator (hex/hsla strings
only) before storing, so admin cannot inject `url(javascript:...)`.

### 3.3 Routing strategy: path, not subdomain

Two routing models were considered:

| Model | URL example | Pros | Cons |
|------|-------------|------|------|
| **Path prefix** | `/es/women/products/linen-dress` | Simple infra; Next.js App Router native; one cert; one PWA install; shared sessions & cart | Departments share origin (no privilege boundary needed for this product) |
| **Subdomain** | `women.cabox.cr/es/products/...` | Brand separation feels independent | Separate cert or wildcard cert; extra nginx per store; cross-subdomain session cookies; cart/auth becomes fragile; PWA per subdomain |

**Decision:** **Path prefix** (`/{locale}/{departmentSlug}/...`). Keeps the
existing single-origin model the handoff document already uses.
Subdomains remain a later option per the nginx note in the handoff.

### 3.3.1 Concrete URL shape (after this plan lands)

| URL | Purpose |
|-----|---------|
| `/es/` | **Lobby landing**: tiles for each active department + Featured products strip. |
| `/es/products` | Aggregate product grid across all active departments (kept for search/SEO and internal filters). |
| `/es/products/{slug}` | Legacy product URL → **308-redirect** to `/es/{primaryDept.slug}/products/{slug}`. |
| `/es/{dept}` | Department home (hero, per-dept featured, category pills). |
| `/es/{dept}/products` | Filtered product grid inside one department. |
| `/es/{dept}/products/{slug}` | Product detail; **canonical** when `{dept}` matches the primary department. |

Rules:

- **Landing is the lobby**, NOT a product grid — see §7.8 for the component
  spec. Each department tile uses its own `theme.primary` as accent color so
  the lobby previews the skin before you enter a department.
- **Aggregate `/products`** remains indexable as a "search everything" page
  (good for internal search, Google sitelinks, and back-compat).
- **Canonical** for a product is always its `primaryDepartment.slug` path.
- Secondary-department paths render the same product but set
  `<link rel="canonical">` to the primary path.
- **No breaking existing bookmarks**: `/es/products/{slug}` (no department)
  308-redirects to the canonical URL.

### 3.4 Cart & checkout

**One cart, one order, one payment** — even with multi-department products.

Rationale:
- Payment/invoice/orderNumber model is already department-agnostic.
- Customers hate being forced to check out twice.
- Admin reconciliation is simpler.

Each `OrderItem` snapshots `primaryDepartmentId` at purchase time (for reports
like "sales per department"). Pure snapshot; no runtime join needed to report.

### 3.5 Launch departments (seeded by migration M1)

Five departments are seeded on day one. All existing products/categories are
backfilled into **General** and the store owner manually classifies them from
the admin UI (§3.5.1).

| slug        | nameEs        | nameEn           | isDefault | Notes |
|-------------|---------------|------------------|-----------|-------|
| `general`   | General       | General          | ✅         | Always exists; not deletable; theme `{}` = global fallback |
| `outlet`    | Outlet        | Outlet           |           | Discount-focused skin, can host sale banners |
| `bisuteria` | Bisutería     | Fashion Jewelry  |           | Accessories-heavy; own palette/hero |
| `home`      | Hogar         | Home             |           | Home & decor items |
| `tools`     | Herramientas  | Tools            |           | Tools & hardware |

Rules:

- Exactly one row has `isDefault = true` (**General**), enforced by a
  partial unique index: `CREATE UNIQUE INDEX ... ON "Department"("isDefault") WHERE "isDefault" = true`.
- General is **not deletable** while any row references it (FK `ON DELETE
  RESTRICT`); soft-deactivate via `isActive = false` is allowed but
  discouraged (see §7.2: General is the fallback for "unclassified" admin
  view).
- Each seeded department can optionally have a starter `theme` — left empty
  at M1 so the owner sets colors in the admin theme editor when ready.

### 3.5.1 "Unclassified" admin workflow (first-class requirement)

Because the owner will manually sort products into the new departments, the
admin UI must surface **products that are still only in General** as a
dedicated "Unclassified" view — otherwise sorting 2000 products by clicking
each row is unworkable.

Definition (SQL-level):

```sql
-- A product is "Unclassified" if its ONLY department link is General.
SELECT p.*
FROM "Product" p
JOIN "DepartmentProduct" dp ON dp."productId" = p.id
GROUP BY p.id
HAVING COUNT(*) = 1
   AND MAX(dp."departmentId") = (SELECT id FROM "Department" WHERE slug = 'general');
```

Admin UX (see §8.2):

- `/admin/products?filter=unclassified` — paged table with bulk-select +
  bulk-assign ("Move selected to Bisutería", etc.).
- Products remain in General **and** gain the new department (M2M); the owner
  can optionally remove General via a bulk "Remove from General" action.
- Counter badge in the sidebar: `Unclassified (N)` so it is always obvious
  how many products still need sorting.
- Same filter available for `/admin/categories` (categories not assigned to
  any non-General department).

### 3.6 Soft-delete / toggle, not hard delete

Departments flip `isActive = false` rather than delete. Prevents losing
historical order attribution and snapshot integrity.

---

## 4. Schema changes (Prisma)

> All new models; existing Product/Category extended, not replaced.
> Migrations are **staged** (see §6) so no step breaks the running app.

```prisma
model Department {
  id        String   @id @default(cuid())
  slug      String   @unique                // "general", "women", "men"
  nameEn    String
  nameEs    String
  taglineEn String   @default("")
  taglineEs String   @default("")
  isActive  Boolean  @default(true)
  isDefault Boolean  @default(false)        // exactly one row true (enforced in app)
  position  Int      @default(0)            // menu ordering
  heroImageUrl String?
  logoUrl      String?
  theme     Json     @default("{}")         // validated JSON shape (see §3.2)
  navOverrideJson Json?                     // optional per-dept nav (links, CTAs)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  categories       DepartmentCategory[]
  products         DepartmentProduct[]
  primaryProducts  Product[]  @relation("PrimaryDepartmentProducts")
  primaryCategories Category[] @relation("PrimaryDepartmentCategories")

  @@index([isActive])
  @@index([position])
}

model DepartmentCategory {
  departmentId String
  categoryId   String
  position     Int        @default(0)

  department Department @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  category   Category   @relation(fields: [categoryId],   references: [id], onDelete: Cascade)

  @@id([departmentId, categoryId])
  @@index([categoryId])
}

model DepartmentProduct {
  departmentId String
  productId    String
  position     Int        @default(0)

  department Department @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  product    Product    @relation(fields: [productId],    references: [id], onDelete: Cascade)

  @@id([departmentId, productId])
  @@index([productId])
}

// Many-to-many Product ↔ Category (kept alongside Product.primaryCategoryId)
model ProductCategory {
  productId  String
  categoryId String
  position   Int      @default(0)

  product  Product  @relation(fields: [productId],  references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([productId, categoryId])
  @@index([categoryId])
}
```

### Changes to existing models

```prisma
model Category {
  // ... existing fields unchanged ...
  primaryDepartmentId String?          // NULLABLE during backfill; tighten in M2
  primaryDepartment   Department?      @relation("PrimaryDepartmentCategories",
                                                  fields: [primaryDepartmentId], references: [id])
  departments         DepartmentCategory[]
  productLinks        ProductCategory[]
  // (existing `products Product[]` relation is REMOVED in M3 after data is copied
  //  to ProductCategory. See §6.)
  @@index([primaryDepartmentId])
}

model Product {
  // ... existing fields unchanged ...
  // `categoryId` / `category` RENAMED → primaryCategoryId / primaryCategory in M3.
  primaryCategoryId   String
  primaryCategory     Category   @relation(fields: [primaryCategoryId], references: [id])
  primaryDepartmentId String?    // NULLABLE during backfill; tighten in M2
  primaryDepartment   Department? @relation("PrimaryDepartmentProducts",
                                             fields: [primaryDepartmentId], references: [id])
  categories          ProductCategory[]
  departments         DepartmentProduct[]

  @@index([primaryCategoryId])
  @@index([primaryDepartmentId])
}

model OrderItem {
  // Snapshot at purchase time, not a live FK (never fails if dept deleted later)
  departmentSlug   String?            // snapshot, e.g. "women"
  departmentNameEs String?
  departmentNameEn String?
}
```

---

## 5. Migration sequence (staged, zero-downtime)

Do **not** combine these. Each stage is one Prisma migration + one deploy.

### M1 — Create Department tables (additive, nullable)

- `CREATE TABLE Department, DepartmentCategory, DepartmentProduct, ProductCategory`.
- `ALTER TABLE Product ADD COLUMN primaryDepartmentId NULL`.
- `ALTER TABLE Category ADD COLUMN primaryDepartmentId NULL`.
- Partial unique index enforcing exactly-one `isDefault`:
  `CREATE UNIQUE INDEX "Department_one_default" ON "Department"("isDefault") WHERE "isDefault" = true`.
- Seed the **5 launch departments** (idempotent `ON CONFLICT (slug) DO NOTHING`):
  `general` (isDefault=true), `outlet`, `bisuteria`, `home`, `tools`.

App after M1: still uses `Product.categoryId`. Nothing else changes. Safe to
roll back.

### M2 — Backfill

SQL (inside one migration, wrapped in a transaction):

```sql
-- 1. Link all products to "General"
INSERT INTO "DepartmentProduct" ("departmentId", "productId", "position")
SELECT d.id, p.id, 0
FROM "Product" p, "Department" d
WHERE d.slug = 'general'
ON CONFLICT DO NOTHING;

UPDATE "Product" p
SET "primaryDepartmentId" = (SELECT id FROM "Department" WHERE slug = 'general')
WHERE p."primaryDepartmentId" IS NULL;

-- 2. Link every category to "General"
INSERT INTO "DepartmentCategory" ("departmentId", "categoryId", "position")
SELECT d.id, c.id, 0
FROM "Category" c, "Department" d
WHERE d.slug = 'general'
ON CONFLICT DO NOTHING;

UPDATE "Category" c
SET "primaryDepartmentId" = (SELECT id FROM "Department" WHERE slug = 'general')
WHERE c."primaryDepartmentId" IS NULL;

-- 3. Copy Product.categoryId into the new ProductCategory M2M
INSERT INTO "ProductCategory" ("productId", "categoryId", "position")
SELECT p.id, p."categoryId", 0
FROM "Product" p
WHERE p."categoryId" IS NOT NULL
ON CONFLICT DO NOTHING;
```

Then tighten:

```sql
ALTER TABLE "Product"  ALTER COLUMN "primaryDepartmentId" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "primaryDepartmentId" SET NOT NULL;
```

App after M2: still uses `Product.categoryId`. All reads/writes continue. Admin
& storefront unchanged. This is the safe fallback point.

### M3 — Rename `categoryId` → `primaryCategoryId`

- `ALTER TABLE "Product" RENAME COLUMN "categoryId" TO "primaryCategoryId"`.
- Prisma migration renames the relation; regenerate client.
- Drop `Category.products` relation from Prisma (replaced by
  `ProductCategory` + `primaryCategory`). Data is untouched.
- Update **all code** (see §7) in the same PR.

This is the only breaking code change. Keep it behind an atomic PR that
updates every query referencing `product.category` or
`product.categoryId`.

### M4 — Enable per-department theming & routing (new UI)

Non-schema: see §7 (app code), §8 (admin UI). No more migrations.

---

## 6. Backfill & rollback notes

- **All three M1 & M2 migrations are reversible** if we keep the old
  `categoryId` column populated until M3 runs.
- Prisma's `directUrl` / `DATABASE_URL_DIRECT` is already used for migrations
  (PgBouncer bypass). Keep it that way.
- Before M3, take a **full DB backup** using the new `bin/start.sh` B option;
  keep the archive out-of-tree (already `.gitignore`d).
- Rollback M3 = rename column back and restore deleted `Category.products`
  relation in Prisma. Data is intact because `ProductCategory` was populated
  from the same source during M2.

---

## 7. App-code changes

### 7.1 Lib helpers (new)

- `lib/departments.ts`
  - `getActiveDepartments()` — cached (Redis/`unstable_cache` 5 min).
  - `getDepartmentBySlug(slug)` — 404s gracefully.
  - `getDefaultDepartment()` — returns the `isDefault = true` row (General).
- `lib/theme.ts`
  - `renderDepartmentThemeStyles(dept)` → returns a `<style>` string with CSS
    custom properties scoped to `body.theme-department-{slug}`.
  - `sanitizeThemeJson(json)` — strict hex/hsla validator; rejects `url(...)`,
    `expression(...)`, `\`, etc.
- `lib/canonical.ts`
  - `productCanonicalUrl(product)` → `/es/{primaryDept.slug}/products/{slug}`.

### 7.2 Routing

Introduce a new route group:

```
app/[locale]/(store)/[department]/
  layout.tsx            → loads department, applies theme, renders Navbar
  page.tsx              → department home (hero, featured, category pills)
  products/
    page.tsx            → filtered product grid (dept-scoped)
    [slug]/page.tsx     → product detail, canonical to primary dept
```

`generateStaticParams` from `getActiveDepartments()` for ISR.

The **aggregate** `/{locale}/products` route stays and lists all active
products across active departments; primary-department slug shown as chip
badge on each card.

Middleware: no change to `next-intl` routing; department slug is a URL
segment inside the existing `[locale]` group.

### 7.3 Layout & theming injection

In `app/[locale]/(store)/[department]/layout.tsx`:

```
const dept = await getDepartmentBySlug(params.department);
if (!dept || !dept.isActive) notFound();

return (
  <>
    <style dangerouslySetInnerHTML={{ __html: renderDepartmentThemeStyles(dept) }} />
    <body className={`theme-department-${dept.slug}`}>
      <Navbar department={dept} locale={locale} />
      {children}
      <CartDrawer locale={locale} />
    </body>
  </>
);
```

Rule: department CSS **overrides** only CSS custom properties on
`body.theme-department-{slug}`. The global `:root` tokens remain the
fallback, so a department with `theme = {}` looks identical to today.

### 7.4 Query changes

| Today | After |
|------|------|
| `prisma.product.findMany({ where: { category: { slug: cat } } })` | `prisma.product.findMany({ where: { departments: { some: { department: { slug: dept } } }, categories: { some: { category: { slug: cat } } } } })` |
| `product.category.nameEs` | `product.primaryCategory.nameEs` |
| `prisma.category.findMany({ where: { parentId: null } })` | `prisma.category.findMany({ where: { parentId: null, departments: { some: { department: { slug: dept } } } } })` |

Write updates (admin product save) populate `primaryDepartmentId`,
`primaryCategoryId`, the `DepartmentProduct` rows, and the `ProductCategory`
rows in a single transaction.

### 7.5 Sitemap & SEO

- `app/sitemap.ts` emits entries per active department for both locales.
- `productCanonicalUrl()` used in product page `<head>` `<link rel="canonical">`.
- JSON-LD `BreadcrumbList` includes the primary department segment.
- `<meta name="theme-color">` set to `dept.theme.primary ?? defaultPrimary`.

### 7.6 Navbar

- Shows **department switcher** only when there is more than one active
  department.
- Category dropdown scoped to current department's categories.

### 7.7 Cart

- No model change. Line items carry the product's primary-department label
  for clarity; checkout flow is unchanged.

### 7.8 Lobby landing (`/{locale}/`)

- Fetches `getActiveDepartments()` (cached).
- Renders a grid of **department tiles**: hero image (or generated gradient
  from `theme.primary`→`theme.primaryDark`), bilingual name, tagline, CTA
  "Explorar". Each tile links to `/{locale}/{dept.slug}`.
- Below the tiles: **Featured products strip** (`featured = true`,
  `status = ACTIVE`), capped at 8, with a per-card chip showing the primary
  department.
- Value-props row (existing shipping / quality / WhatsApp / secure payment
  block) remains under the strip.
- Fully static-renderable (ISR revalidate 120s).

- No change to model.
- Line-item rendering shows department chip (optional, behind settings).
- Order creation snapshots `OrderItem.departmentSlug` from
  `product.primaryDepartment.slug`.

---

## 8. Admin UX

### 8.1 New: `/admin/departments`

- Table: slug, names (ES/EN), active, default, theme preview swatch.
- Drag-and-drop reorder (`position`).
- Detail page: general info + theme editor (color pickers bound to JSON
  fields) + hero/logo uploaders + live preview iframe.
- Prevent delete if `primaryProducts` or `primaryCategories` exist; prompt to
  reassign first. Offer soft-deactivate instead.

### 8.2 Product list & form

Product list (`/admin/products`):

- New filter chips above the table: **All · Unclassified · General · Outlet
  · Bisutería · Home · Tools** (auto-generated from active departments + the
  synthetic "Unclassified" view from §3.5.1).
- Bulk toolbar when ≥ 1 row selected:
  - "Add to department…" (multi-select).
  - "Set primary department…".
  - "Remove from General" (disabled if product is only in General — would
    leave it orphaned).
- Row indicator: department chips (primary bold) on every row.
- Sidebar badge: `Unclassified (N)` derived from the SQL in §3.5.1, cached
  60s.

Product form:

- Add **Departments** multi-select (chip UI); first chip = primary.
- Change "Category" control to **Categories** multi-select; first chip =
  primary. Guard: primary category must belong to at least one of the selected
  departments (soft warning, not a block).
- Autosave side-effect: if a product is assigned to any non-General
  department, it disappears from the Unclassified filter but remains in
  General unless the owner removes it.

### 8.3 Category form

- Add **Departments** multi-select + primary.
- Hierarchy (parent) stays; moving parents across departments is allowed.

### 8.4 Settings

- Add "Departments" global defaults card: default font display/body, whether
  the aggregate `/products` page is public, department switcher placement.

---

## 9. SEO, accessibility, performance

- Canonical enforced everywhere (see §7.1).
- `hreflang` alternates: one per `{locale}` × `{department}` combo.
- `<meta name="theme-color">` dynamic per department (for Chrome/Android PWA
  status bar).
- Color contrast validator in the admin theme editor (WCAG AA minimum on
  `primary` vs `bg-card` and on `text` vs `bg`).
- Theme JSON injected once per response (server render), not per component.
- Cache department lookup (Redis 5 min) to avoid N+1 from Navbar.
- Add DB indexes (see schema).

---

## 10. PWA

- Single manifest at `/manifest.json` keeps Cabox installable as one app.
- Theme color in manifest uses the General department (safe default).
- Future: if a department needs its own installable PWA, move it to a
  subdomain at that point; not in this plan.

---

## 11. Rate limiting, auth, invoices

- Rate limiting: no change (already per-IP / per-admin).
- Auth: unchanged; admin is a single group.
- Invoices: unchanged — one invoice per order, even if multi-department cart.
  Add `departmentSlug` column to `Invoice.items` JSON snapshot for reporting.

## 11.1 Promotions / coupons scoping (forward-compatible, not built in P1–P5)

Decision: department-scoped promotions will ship **after** the core
department rollout.

Forward-compatible prep taken in this plan:

- `Promotion` already has `applicableTo PromotionScope` (`ALL | CATEGORY |
  PRODUCT`). In a later migration, add `DEPARTMENT` to the enum and
  `departmentIds String[]` column; no breaking change.
- `OrderItem.departmentSlug` snapshot (§4) lets future reports break
  promotion usage down by department without data loss.

Not built yet, but the schema and snapshot fields required are in place.

---

## 12. Reports (future-friendly hooks)

- Add a view `department_sales_view` (SQL view, not Prisma) aggregating
  `OrderItem.departmentSlug` → units/revenue/30d.
- Dashboard widget "Revenue by department" (Recharts pie).

---

## 13. Testing checklist

Unit:

- `sanitizeThemeJson` rejects bad CSS values.
- `productCanonicalUrl` always returns the primary-department URL.
- `getDepartmentBySlug` returns 404 for inactive departments.

Integration / E2E (Playwright):

- Seeding produces General + all existing products assigned to it.
- Visiting `/es/products/{oldSlug}` 308-redirects to the new canonical path.
- Switching departments swaps theme tokens but preserves cart contents.
- Admin can't delete a department that still has primary products.
- Adding a product with `departments: [A, B]` makes it visible on A, B, and
  the aggregate page, with canonical on A.

Visual regression: snapshot General and each seeded department home.

---

## 14. Phased rollout

| Phase | Ships | Notes |
|------|------|------|
| P1 | M1 migration + seed General | No UI change. Deployable alone. |
| P2 | M2 backfill | Still no UI change. Safe, reversible. |
| P3 | M3 rename + full code update (queries, canonical URL, redirects, sitemap) | Single PR, feature-flag-free: default department makes it a no-op visually. |
| P4 | `/admin/departments` CRUD + theme editor | Admin only. |
| P5 | Department-scoped routes + Navbar switcher | Storefront sees departments for the first time. Launch copy: "Cabox, now with curated departments". |
| P6 | Optional: reporting widget, per-dept promotions scope | Later. |

Keep `.ai/context/HANDOFF.md` in sync at every phase.

---

## 15. Decisions (locked 2026-04-17)

1. **Launch departments** — `general`, `outlet`, `bisuteria`, `home`, `tools`
   (§3.5). General is the default and not deletable.
2. **Classification strategy** — all existing products are backfilled to
   General only. Owner manually reclassifies via the admin UI, assisted by
   the **Unclassified** filter and bulk-assign toolbar (§3.5.1, §8.2).
3. **Landing page** — **lobby** of department tiles + featured strip at
   `/{locale}/`. Not an aggregate product grid; not a redirect (§7.8).
4. **Promotions/coupons per department** — deferred. Schema & snapshots are
   already forward-compatible (§11.1). No extra migration today.
5. **Currency** — global across all departments. No change to `Order` /
   `Product` currency handling.
6. **Theme allowlist** — strict JSON allowlist of safe fields. **No raw
   CSS, no custom selectors.** Accepted keys:

   | Key | Type | Use |
   |-----|------|-----|
   | `primary`, `primaryDark`, `secondary`, `accent` | hex `#RRGGBB(AA)` or `hsla()` | Brand palette |
   | `bg`, `bgCard`, `text`, `textMuted`, `border`, `borderLight` | same color format | Surface / text palette |
   | `sale`, `success`, `warning`, `error` | same | Status palette |
   | `displayFont`, `bodyFont` | string (allowlist: `Playfair Display`, `Inter`, `Poppins`, `DM Serif Display`, `Lora`) | Optional font swap |
   | `logoUrl`, `heroImageUrl` | `/` or `https://` URL only | Assets |

   Any other key in the JSON is **silently dropped** by `sanitizeThemeJson`;
   any color that does not match the hex/hsla regex is rejected; any URL that
   is not same-origin or `https:` is rejected. This is the safest balance
   between admin flexibility and no-CSS-injection, and I recommend keeping
   this boundary strict.

---

## 16. Summary

- Departments are a **1-to-many wrapper above categories**, implemented as
  new tables plus a single backfill to a seeded **General** department, so
  nothing breaks on day one.
- Products and categories are many-to-many with a required **primary**
  pointer — industry-standard, SEO-safe, and admin-friendly.
- Theming is stored as JSON on each department and injected as CSS custom
  properties on a `body.theme-department-{slug}` scope — zero build-time
  coupling, zero risk to the existing global design system.
- Routing uses **path prefixes**, not subdomains — one origin, one cert, one
  PWA, one cart, shared checkout & auth.
- Migrations are **staged into 3 reversible Prisma migrations** (create,
  backfill, rename); each phase is independently deployable and safe to roll
  back until the next phase starts.

This gives Cabox a real multi-department "meta-storefront" without forking
any infrastructure, while keeping every existing product, category, order,
and URL working from the moment M1 ships.
