# Cabox — Curated Fashion PWA Store · Implementation Plan

> **License**
> Copyright (c) 2026 Alejandro Castro. All rights reserved.
> Source code is made publicly visible for reference and review purposes only.
> No permission is granted to use, copy, modify, or distribute this code
> without explicit written consent from the author.

> **Date**: 2026-03-21  
> **Keyword**: `pwa_ecommerce`  
> **Status**: Draft — Awaiting Review

---

## 1. Executive Summary

Build a production-ready, bilingual (EN/ES) Progressive Web App for **Cabox — Curated Fashion**. The platform serves two audiences through two distinct interfaces:

| Interface | Audience | Purpose |
|-----------|----------|---------|
| **Public Storefront** | Customers (B2C) | Browse catalog, add to cart, checkout, track orders, WhatsApp support |
| **Admin Dashboard** | Store owner (B2B) | Manage inventory, AI product research, pricing, invoicing, reports |

The system integrates AI-powered product intelligence (image recognition → spec extraction → competitive pricing), multi-channel payment processing (Cash, SINPE, Bank Transfer, Credit Card, PayPal), automated shipping calculations, and WhatsApp Business connectivity.

---

## 2. Brand Identity (Extracted from Logo)

The logo `tmp/cabox.jpeg` establishes the visual identity:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#8B5E3C` | Warm brown — headers, buttons, borders |
| `--color-primary-dark` | `#6B4226` | Darker brown — hover states, active elements |
| `--color-secondary` | `#D4956A` | Soft tan/caramel — secondary buttons, tags |
| `--color-accent` | `#C75B7A` | Pink/rose — CTAs, sale badges, highlights |
| `--color-bg` | `#FAF3EB` | Cream/ivory — page backgrounds |
| `--color-bg-card` | `#FFFFFF` | White — card surfaces |
| `--color-text` | `#3A2A1A` | Dark brown — body text |
| `--color-text-muted` | `#8A7A6A` | Muted brown — secondary text |
| `--font-display` | `'Playfair Display', serif` | Headings — elegant, fashion-forward |
| `--font-body` | `'Inter', sans-serif` | Body text — clean readability |

---

## 3. Technical Stack — Optimal Selection & Justification

### 3.1 Core Framework: Next.js 15+ (App Router)

| Considered | Verdict | Why |
|------------|---------|-----|
| **Next.js 15+ (App Router)** ✅ | **Selected** | React Server Components for zero-JS catalog pages (SEO-critical for a store). Built-in API routes eliminate need for separate backend. Image optimization via `next/image`. Streaming SSR for fast initial paint. Vercel-native deployment. |
| Vite + React | Rejected | No SSR = poor SEO for product pages. Would require a separate API server (Express/Fastify) adding deployment complexity. |
| Remix | Rejected | Excellent SSR but smaller ecosystem, fewer ready-made eCommerce patterns, weaker PWA story. |
| Astro | Rejected | Great for static content but weak for dynamic admin dashboards and cart state management. |

**Version**: Next.js 15.x stable (latest). Using the App Router (`/app` directory) with `src/` directory structure and TypeScript strict mode.

### 3.2 PWA Layer: `@ducanh2912/next-pwa`

| Considered | Verdict | Why |
|------------|---------|-----|
| `@ducanh2912/next-pwa` ✅ | **Selected** | Actively maintained fork of the original `next-pwa`. Supports App Router, automatic service worker generation via Workbox, caching strategies per route, and web manifest integration. |
| `serwist` | Backup | Modern Workbox alternative but less Next.js-specific documentation. |

**Capabilities**: Offline product browsing (pre-cached catalog), installable to home screen, push notification ready for future order alerts.

### 3.3 UI Component Library: shadcn/ui + Tailwind CSS v4

| Considered | Verdict | Why |
|------------|---------|-----|
| **shadcn/ui** ✅ | **Selected** | Copy-paste component library (not a dependency). Full ownership of every component. Built on Radix UI primitives (accessibility baked in). 50 production components. Themeable via CSS variables — perfect for the Cabox brand palette. |
| Material UI (MUI) | Rejected | Heavy bundle, opinionated Google aesthetic conflicts with fashion brand identity. |
| Chakra UI | Rejected | Runtime CSS-in-JS has performance implications for SSR product pages. |
| Ant Design | Rejected | Enterprise-oriented design language doesn't fit a curated fashion aesthetic. |

**shadcn/ui Component Mapping to Cabox Pages**:

| Page / Feature | shadcn/ui Components Used |
|----------------|--------------------------|
| **Store Navbar** | `navigation-menu`, `sheet` (mobile menu), `badge` (cart count), `dropdown-menu` (language) |
| **Product Catalog** | `card`, `badge` (sale/new), `select` (sort/filter), `pagination`, `skeleton` (loading) |
| **Product Detail** | `carousel` (image gallery), `button`, `badge`, `tabs` (description/specs/reviews), `separator` |
| **Cart Drawer** | `sheet` (slide-in cart), `button`, `separator`, `scroll-area` |
| **Checkout** | `form`, `input`, `select`, `radio-group` (payment methods), `label`, `button`, `alert` |
| **Order Confirmation** | `card`, `separator`, `badge` (status), `alert` |
| **Admin Sidebar** | `collapsible`, `button`, `badge` (notifications), `tooltip`, `separator` |
| **Admin Dashboard** | `card` (stats), `chart` (recharts), `tabs`, `progress`, `badge` |
| **Product CRUD** | `form`, `input`, `textarea`, `select`, `switch` (active/draft), `dialog` (confirm delete), `data-table` |
| **AI Research Panel** | `card`, `button`, `skeleton` (loading), `tabs`, `alert`, `carousel` (promo images) |
| **Order Management** | `data-table`, `badge` (status), `dropdown-menu` (actions), `dialog` (status update) |
| **Inventory** | `data-table`, `input`, `button`, `alert-dialog` (low stock warning) |
| **Invoices** | `table`, `button`, `badge`, `dialog` (preview) |
| **Reports** | `chart` (recharts), `card`, `tabs`, `select` (date range), `date-picker` |
| **Settings** | `form`, `input`, `switch`, `button`, `tabs`, `separator` |
| **Toasts (Global)** | `sonner` — non-blocking notifications for cart, order, and save confirmations |

**Admin Dashboard Block**: Leveraging shadcn/ui `dashboard-05` block (responsive + collapsible sidebar) as the admin layout foundation.

### 3.4 Internationalization: `next-intl`

| Considered | Verdict | Why |
|------------|---------|-----|
| `next-intl` ✅ | **Selected** | Highest benchmark score (88.25/100) among i18n libraries. Native App Router support with `[locale]` segment routing. ICU message syntax for plurals/gender. Type-safe `useTranslations()` hook. Server Component support. |
| `next-i18next` | Rejected | Designed for Pages Router; App Router support is bolted on. |
| `next-international` | Rejected | Simpler but less feature-rich (no ICU, limited formatting). |

**Routing**: URL-prefix strategy → `/en/products/...` and `/es/productos/...`. Middleware detects `Accept-Language` header on first visit and redirects. Default locale: `es`.

**Scope**:
- **Public storefront**: Fully bilingual (EN + ES). All UI text, product data, promotions, error messages, and emails.
- **Admin dashboard**: English-only. Admin routes skip `[locale]` segment → `/admin/...` (no `next-intl` wrapping). This simplifies admin development without impacting the customer experience.
- **Invoices & WhatsApp**: Rendered in the customer's locale (stored as `Order.locale` at checkout time).

### 3.5 Database & ORM: PostgreSQL + Prisma

| Considered | Verdict | Why |
|------------|---------|-----|
| **PostgreSQL (Supabase)** ✅ | **Selected** | ACID compliance for financial data (orders, invoices). JSON columns for flexible attributes. Full-text search for product catalog. Supabase provides hosted Postgres + auth + storage + real-time in one platform. |
| MongoDB | Rejected | Flexible schema is tempting but weak for relational data (orders→items→products). No ACID transactions without workarounds. |
| SQLite | Rejected | No concurrent writes; not suitable for a multi-user store. |
| PlanetScale/MySQL | Viable | But Postgres JSON support is superior for product attributes, and Supabase bundles more. |

| ORM | Verdict | Why |
|-----|---------|-----|
| **Prisma** ✅ | **Selected** | Type-safe generated client. Visual migration system. Schema-as-code (version controlled). Seed scripts for dev data. |
| Drizzle | Viable | Lighter weight, but Prisma's ecosystem (Prisma Studio, migration tooling) is more mature for a v1 build. |

### 3.6 Authentication: NextAuth.js v5 (Auth.js)

**Strategy**: Admin-only authentication. Customers do NOT need accounts (guest checkout model — reduces friction for a curated fashion store).

- **Provider**: `CredentialsProvider` with bcrypt-hashed passwords stored in `User` table.
- **Session**: JWT strategy (stateless, no session DB required).
- **Middleware**: `middleware.ts` protects all `/admin/**` routes (admin is outside `[locale]` — English-only).
- **Roles**: `ADMIN` and `SUPER_ADMIN` stored in JWT claims.

### 3.7 Storage: Supabase Storage

- **Product Images**: `products/{productId}/{position}.webp` — auto-resized by Supabase Image Transformations.
- **Reference Uploads**: `references/{productId}/original.{ext}` — admin-uploaded images for AI analysis.
- **Invoices**: `invoices/{invoiceNumber}.pdf` — generated PDF storage.
- **Policy**: Public read for product images. Admin-only write. References and invoices are private (signed URLs).

### 3.8 Social Commerce & Tracking APIs

| System | Role | Why |
|--------|------|-----|
| **Meta Pixel** | Client-side tracking | Standard FB/IG retargeting for page views and `AddToCart`. |
| **Meta Conversions API (CAPI)** | Server-side tracking | Bypasses iOS/browser ad-blockers to guarantee 100% accurate `Purchase` events directly from the Next.js server. |
| **Product XML Feeds** | Catalog syncing | Automatically keeps Instagram/Facebook Shop and Google Shopping in sync with exactly what is in the DB, including localized prices/names. |

| Method | Integration | Automation Level |
|--------|-------------|-----------------|
| **Credit Card** | Stripe Checkout (redirect mode) | Fully automated — webhook confirms payment |
| **PayPal** | PayPal JS SDK (inline buttons) | Fully automated — webhook confirms payment |
| **SINPE** | Manual | Display SINPE number + QR code; admin marks as paid |
| **Bank Transfer** | Manual | Display account details; admin marks as paid |
| **Cash** | Manual | In-person; admin marks as paid on delivery |

> [!IMPORTANT]
> **Manual Payment Credentials (PLACEHOLDER — fill before Phase 3)**
> 
> | Field | Placeholder | Notes |
> |-------|-------------|-------|
> | SINPE number | `SINPE_PHONE_NUMBER=CR-XXXX-XXXX` | The phone number registered for SINPE Móvil |
> | Account holder name | `SINPE_ACCOUNT_NAME="YOUR NAME HERE"` | Displayed on checkout for customer reference |
> | Bank name | `BANK_NAME="YOUR BANK HERE"` | e.g. "Banco Nacional", "BAC" |
> | IBAN | `BANK_IBAN="CR00 0000 0000 0000 0000 00"` | Full IBAN for wire transfers |
> | Bank account holder | `BANK_ACCOUNT_NAME="YOUR NAME HERE"` | Must match ID exactly |

### 3.9 AI & Research APIs

| API | Purpose | Cost Model | Rate Limits |
|-----|---------|-----------|-------------|
| **Google Cloud Vision** | Extract labels, text, colors from uploaded reference images | $1.50/1000 images | 1800 req/min |
| **Perplexity API** (sonar-pro) | Generate product specs, descriptions (EN/ES), market prices | $5/1000 requests | 50 req/min |
| **Google Custom Search API** | Fetch high-quality promotional product images | $5/1000 queries (100 free/day) | 100/day free |

### 3.10 Communication: WhatsApp Business Cloud API

- **Customer → Store**: Simple `wa.me/{phone}?text={encoded cart summary}` link (zero API needed).
- **Store → Customer**: Via Meta's WhatsApp Cloud API for order notifications:
  - Template messages: order confirmation, payment received, shipped, delivered.
  - **Individual accounts** can use the API immediately; unverified limit is **250 conversations/day**. Business Verification (tax ID or incorporation doc) unlocks higher tiers (1K → 10K → 100K).

### 3.11 Deployment: Docker-Centric Architecture

The entire project is 100% containerized. Every service runs inside Docker — no local Node.js, PostgreSQL, or Redis installations required.

**Convention: Environment-Suffixed Files**

All Docker-related files carry an environment suffix. Development files are created first; production files are added when needed:

| File | Environment | Purpose |
|------|-------------|---------|
| `Dockerfile.dev` | Development | Node.js + dev server with hot-reload |
| `Dockerfile.prd` | Production | Multi-stage standalone build (~120MB) |
| `docker-compose.dev.yml` | Development | app + postgres + redis (volume-mounted) |
| `docker-compose.prd.yml` | Production | app + postgres + redis + nginx (SSL) |
| `.env.dev` | Development | All env vars for local development |
| `.env.prd` | Production | All env vars for production (added later) |
| `nginx/default.dev.conf` | Development | Simple proxy (no SSL) |
| `nginx/default.prd.conf` | Production | Reverse proxy with SSL termination |

#### Development Stack (`docker-compose.dev.yml`)

| Service | Image | Default Port | Purpose |
|---------|-------|------|---------|
| `app` | Custom (`Dockerfile.dev`) | `3000` | Next.js dev server with hot-reload (volume-mounted `src/`) |
| `db` | `postgres:16-alpine` | `5432` | PostgreSQL database |
| `redis` | `redis:7-alpine` | `6379` | Rate limiting |

#### Multi-Stage Dockerfile (`Dockerfile.dev`)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

#### Production Dockerfile (`Dockerfile.prd` — added when needed)

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["node", "server.js"]
```

#### Multi-Store Spawning Architecture

Multiple stores can run on the **same server** as isolated Docker stacks. Each store gets its own stack name, ports, database, and network.

**How it works**: A `spawn_store.sh` script generates a store-specific `.env.dev` from a template, assigning unique ports:

```bash
#!/bin/bash
# Usage: ./spawn_store.sh <store_name> <app_port> <db_port> <redis_port>
# Example: ./spawn_store.sh cabox 3000 5432 6379
#          ./spawn_store.sh boutique 3100 5433 6380
#          ./spawn_store.sh streetwear 3200 5434 6381

STORE_NAME=$1
APP_PORT=${2:-3000}
DB_PORT=${3:-5432}
REDIS_PORT=${4:-6379}

# Generate store-specific env from template
cp templates/env.dev.template .env.dev
sed -i "s/{{STORE_NAME}}/$STORE_NAME/g" .env.dev
sed -i "s/{{APP_PORT}}/$APP_PORT/g" .env.dev
sed -i "s/{{DB_PORT}}/$DB_PORT/g" .env.dev
sed -i "s/{{REDIS_PORT}}/$REDIS_PORT/g" .env.dev

# Launch with unique stack name
COMPOSE_PROJECT_NAME=$STORE_NAME docker compose -f docker-compose.dev.yml --env-file .env.dev up -d

echo "✅ Store '$STORE_NAME' running at http://localhost:$APP_PORT"
```

**Stack isolation**:

| Store | `COMPOSE_PROJECT_NAME` | App Port | DB Port | Redis Port | Network |
|-------|----------------------|----------|---------|------------|----------|
| `cabox` | `cabox` | `3000` | `5432` | `6379` | `cabox_net` |
| `boutique` | `boutique` | `3100` | `5433` | `6380` | `boutique_net` |
| `streetwear` | `streetwear` | `3200` | `5434` | `6381` | `streetwear_net` |

Each store has:
- Its own PostgreSQL database (isolated data volume: `pgdata_<store_name>`)
- Its own Redis instance (isolated)
- Its own Docker network (no cross-store communication)
- Single codebase — customization via environment injection only

**Key design decisions**:
- Uses Next.js `output: 'standalone'` in `next.config.mjs` for production — produces a self-contained `server.js` (~15MB).
- Development uses volume mounts for `src/`, `prisma/`, and `public/` for instant hot-reload.
- Prisma migrations run via `docker compose exec app npx prisma migrate deploy`.
- All ports are parameterized via `.env.dev` — no hardcoded values in compose files.

#### Docker Commands (Daily Workflow)

```bash
# Start development environment
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f app

# Run Prisma migrations
docker compose -f docker-compose.dev.yml exec app npx prisma migrate dev

# Open Prisma Studio
docker compose -f docker-compose.dev.yml exec app npx prisma studio

# Run tests
docker compose -f docker-compose.dev.yml exec app npm run test

# Stop stack
docker compose -f docker-compose.dev.yml --env-file .env.dev down

# Spawn additional store on same server
./spawn_store.sh boutique 3100 5433 6380
```

### 3.12 Complete `package.json` Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next-intl": "^3.20.0",
    "@prisma/client": "^6.0.0",
    "next-auth": "^5.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "stripe": "^17.0.0",
    "@paypal/react-paypal-js": "^8.7.0",
    "zustand": "^5.0.0",
    "@react-pdf/renderer": "^4.0.0",
    "recharts": "^2.14.0",
    "embla-carousel-react": "^8.5.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-checkbox": "^1.1.0",
    "@radix-ui/react-radio-group": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-scroll-area": "^1.2.0",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-navigation-menu": "^1.2.0",
    "@radix-ui/react-collapsible": "^1.1.0",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-popover": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "@radix-ui/react-alert-dialog": "^1.1.0",
    "@tanstack/react-table": "^8.20.0",
    "@hookform/resolvers": "^3.9.0",
    "react-hook-form": "^7.54.0",
    "react-day-picker": "^9.4.0",
    "cmdk": "^1.0.0",
    "sonner": "^1.7.0",
    "vaul": "^1.1.0",
    "date-fns": "^4.1.0",
    "zod": "^3.24.0",
    "bcryptjs": "^2.4.3",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.6.0",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "prisma": "^6.0.0",
    "@types/react": "^19.0.0",
    "@types/node": "^22.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "postcss": "^8.4.0",
    "vitest": "^2.1.0",
    "@playwright/test": "^1.49.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:e2e": "playwright test",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "docker:dev": "docker compose -f docker-compose.dev.yml --env-file .env.dev up -d",
    "docker:dev:down": "docker compose -f docker-compose.dev.yml --env-file .env.dev down",
    "docker:logs": "docker compose -f docker-compose.dev.yml logs -f app",
    "docker:prd": "docker compose -f docker-compose.prd.yml --env-file .env.prd up -d --build",
    "docker:prd:down": "docker compose -f docker-compose.prd.yml --env-file .env.prd down"
  }
}
```

---

## 4. Data Models (Prisma Schema)

```prisma
// ── Users & Auth ──
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String
  role          Role      @default(ADMIN)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum Role {
  ADMIN
  SUPER_ADMIN
}

// ── Product Catalog ──
model Category {
  id          String    @id @default(cuid())
  slug        String    @unique
  nameEn      String
  nameEs      String
  image       String?
  parentId    String?
  parent      Category? @relation("SubCategories", fields: [parentId], references: [id])
  children    Category[] @relation("SubCategories")
  products    Product[]
  createdAt   DateTime  @default(now())
}

model Product {
  id              String    @id @default(cuid())
  sku             String    @unique
  slug            String    @unique
  nameEn          String
  nameEs          String
  descriptionEn   String    @db.Text
  descriptionEs   String    @db.Text
  price           Decimal   @db.Decimal(10, 2)
  compareAtPrice  Decimal?  @db.Decimal(10, 2)
  costPrice       Decimal?  @db.Decimal(10, 2)
  currency        Currency  @default(CRC)
  weight          Decimal?  @db.Decimal(8, 2)   // grams
  dimensions      Json?     // { length, width, height in cm }
  status          ProductStatus @default(DRAFT)
  featured        Boolean   @default(false)
  categoryId      String
  category        Category  @relation(fields: [categoryId], references: [id])
  images          ProductImage[]
  variants        ProductVariant[]
  inventory       InventoryRecord[]
  orderItems      OrderItem[]
  referenceData   ProductReference?
  tags            String[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([categoryId])
  @@index([status])
  @@index([featured])
  @@index([createdAt(sort: Desc)])
}

enum Currency {
  CRC   // Costa Rican Colón
  USD   // US Dollar
}

enum ProductStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

model ProductImage {
  id        String   @id @default(cuid())
  url       String
  alt       String?
  position  Int      @default(0)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model ProductVariant {
  id        String   @id @default(cuid())
  nameEn    String   // e.g. "Red / Large"
  nameEs    String
  sku       String   @unique
  price     Decimal? @db.Decimal(10, 2) // override
  stock     Int      @default(0)
  attributes Json    // { color: "red", size: "L" }
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
}

// ── AI Product Research (Admin) ──
model ProductReference {
  id                String   @id @default(cuid())
  productId         String   @unique
  product           Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  referenceImageUrl String?
  visionLabels      Json?    // Google Vision API output
  aiSpecs           Json?    // Perplexity structured specs
  aiDescription     Json?    // { en: "...", es: "..." }
  marketPrices      Json?    // [{ source: "amazon", price: 29.99, url: "..." }, ...]
  suggestedPrice    Decimal? @db.Decimal(10, 2)
  promoImages       Json?    // [{ url, source, thumbnail }]
  lastResearchedAt  DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// ── Inventory ──
model InventoryRecord {
  id         String          @id @default(cuid())
  productId  String
  product    Product         @relation(fields: [productId], references: [id], onDelete: Cascade)
  quantity   Int
  type       InventoryType
  note       String?
  createdAt  DateTime        @default(now())
}

enum InventoryType {
  RESTOCK
  SALE
  ADJUSTMENT
  RETURN
}

// ── Orders ──
model Customer {
  id        String   @id @default(cuid())
  name      String
  email     String?
  phone     String   // primary identifier for WhatsApp users
  whatsappId String?
  address   Json?    // { line1, line2, city, province, postalCode, country }
  orders    Order[]
  createdAt DateTime @default(now())

  @@index([phone])
  @@index([email])
}

model Order {
  id              String       @id @default(cuid())
  orderNumber     String       @unique // human-readable: CAB-20260321-001
  customerId      String
  customer        Customer     @relation(fields: [customerId], references: [id])
  items           OrderItem[]
  subtotal        Decimal      @db.Decimal(10, 2)
  discountAmount  Decimal      @db.Decimal(10, 2) @default(0)
  couponCode      String?      // applied coupon code (snapshot)
  promotionId     String?      // applied promotion (snapshot)
  shippingCost    Decimal      @db.Decimal(10, 2)
  tax             Decimal      @db.Decimal(10, 2) @default(0)
  total           Decimal      @db.Decimal(10, 2)
  currency        Currency     @default(CRC)
  status          OrderStatus  @default(PENDING)
  paymentMethod   PaymentMethod
  paymentStatus   PaymentStatus @default(PENDING)
  paymentRef      String?      // Stripe/PayPal transaction ID or manual ref
  shippingAddress Json
  locale          String       @default("es")  // customer's locale at checkout (for invoices, WhatsApp msgs)
  priceSnapshot   Json?        // full price snapshot at checkout time (guards against price changes)
  notes           String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([customerId])
  @@index([status])
  @@index([paymentStatus])
  @@index([createdAt(sort: Desc)])
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentMethod {
  CASH
  SINPE
  BANK_TRANSFER
  CREDIT_CARD
  PAYPAL
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

model OrderItem {
  id         String  @id @default(cuid())
  orderId    String
  order      Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId  String
  product    Product @relation(fields: [productId], references: [id])
  variantSku String?
  nameEn     String  // snapshot at time of order
  nameEs     String
  price      Decimal @db.Decimal(10, 2)
  quantity   Int
}

// ── Invoicing ──
model Invoice {
  id            String        @id @default(cuid())
  invoiceNumber String        @unique // INV-20260321-001
  orderId       String?
  customerName  String
  customerEmail String?
  items         Json          // snapshot of line items
  subtotal      Decimal       @db.Decimal(10, 2)
  tax           Decimal       @db.Decimal(10, 2)
  total         Decimal       @db.Decimal(10, 2)
  currency      Currency      @default(CRC)
  status        InvoiceStatus @default(DRAFT)
  pdfUrl        String?
  createdAt     DateTime      @default(now())
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  VOID
}

// ── Shipping ──
model ShippingZone {
  id        String   @id @default(cuid())
  nameEn    String
  nameEs    String
  provinces String[] // Costa Rica provinces
  baseRate  Decimal  @db.Decimal(10, 2)
  perKgRate Decimal  @db.Decimal(10, 2)
  freeAbove Decimal? @db.Decimal(10, 2)  // free shipping threshold
}

// ── Promotions & Discounts ──
model Promotion {
  id            String          @id @default(cuid())
  nameEn        String          // "Summer Sale 2026"
  nameEs        String          // "Rebajas de Verano 2026"
  slug          String          @unique
  type          PromotionType
  discountValue Decimal         @db.Decimal(10, 2)  // 15.00 = 15% or ₡1500 flat
  minOrderAmount Decimal?       @db.Decimal(10, 2)  // min cart total to qualify
  maxDiscount   Decimal?        @db.Decimal(10, 2)  // cap for percentage discounts
  applicableTo  PromotionScope  @default(ALL)
  categoryIds   String[]        // when scope = CATEGORY
  productIds    String[]        // when scope = PRODUCT
  startsAt      DateTime
  endsAt        DateTime
  isActive      Boolean         @default(true)
  priority      Int             @default(0)         // higher = applied first
  stackable     Boolean         @default(false)     // can combine with other promos?
  bannerImageUrl String?        // optional promo banner for storefront
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@index([slug])
  @@index([startsAt, endsAt])
  @@index([isActive])
}

enum PromotionType {
  PERCENTAGE    // e.g. 15% off
  FIXED_AMOUNT  // e.g. ₡5000 off
  BUY_X_GET_Y   // e.g. Buy 2 Get 1 Free
  FREE_SHIPPING // waive shipping cost
}

enum PromotionScope {
  ALL           // applies to entire cart
  CATEGORY      // specific categories only
  PRODUCT       // specific products only
}

model Coupon {
  id              String       @id @default(cuid())
  code            String       @unique  // e.g. "VERANO20"
  descriptionEn   String?
  descriptionEs   String?
  type            PromotionType
  discountValue   Decimal      @db.Decimal(10, 2)
  minOrderAmount  Decimal?     @db.Decimal(10, 2)
  maxDiscount     Decimal?     @db.Decimal(10, 2)
  maxUses         Int?         // null = unlimited
  usedCount       Int          @default(0)
  maxUsesPerCustomer Int?      @default(1)
  startsAt        DateTime
  expiresAt       DateTime
  isActive        Boolean      @default(true)
  createdAt       DateTime     @default(now())

  @@index([code])
  @@index([isActive, expiresAt])
}

// ── Price Audit Trail ──
model PriceChangeLog {
  id          String   @id @default(cuid())
  productId   String
  variantSku  String?  // null = base product price change
  oldPrice    Decimal  @db.Decimal(10, 2)
  newPrice    Decimal  @db.Decimal(10, 2)
  reason      String?  // "AI suggestion", "Seasonal adjustment", "Manual"
  changedBy   String   // admin user ID
  createdAt   DateTime @default(now())

  @@index([productId])
  @@index([createdAt(sort: Desc)])
}

// ── Full-Text Search (GIN index added via raw Prisma migration) ──
// Execute in prisma/migrations/XXXXX_add_fts_index/migration.sql:
// CREATE INDEX product_fts_idx ON "Product" USING GIN(
//   to_tsvector('english', "nameEn" || ' ' || "descriptionEn") ||
//   to_tsvector('spanish', "nameEs" || ' ' || "descriptionEs")
// );
```

---

## 5. Project File Structure

```
cabox/
├── .ai/
│   ├── context/
│   │   ├── CONTEXT.md                           # Primary project reference
│   │   ├── CONTEXT_TECH.md                      # Technical stack details
│   │   ├── HANDOFF.md                           # Session resumption handoff
│   │   └── .cursorrules                         # Agent code rules
│   └── plans/
│       └── 20260321_pwa_ecommerce_plan.md   # This file
├── CONTEXT.md                               # Symlink or copy for root-level tools
├── LICENSE
├── Dockerfile.dev                           # Dev: Node.js + hot-reload
├── docker-compose.dev.yml                   # Dev: app + postgres + redis
├── .env.dev                                 # Dev environment variables
├── spawn_store.sh                           # Spawn additional store stacks
├── templates/
│   └── env.dev.template                     # Template for spawning new stores
├── nginx/
│   └── default.dev.conf                     # Nginx dev config (no SSL)
├── next.config.mjs                          # output: 'standalone' for Docker
├── tailwind.config.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                              # Demo data for dev
├── public/
│   ├── manifest.json
│   ├── icons/                               # PWA icons (generated from logo)
│   ├── images/
│   │   └── cabox-logo.jpeg
│   └── locales/                             # Static assets
├── src/
│   ├── app/
│   │   ├── [locale]/                        # i18n root segment
│   │   │   ├── layout.tsx                   # Root layout (fonts, providers)
│   │   │   ├── page.tsx                     # Landing / Home
│   │   │   ├── (store)/                     # Public store routes
│   │   │   │   ├── layout.tsx               # Store layout (nav, footer, cart)
│   │   │   │   ├── products/
│   │   │   │   │   ├── page.tsx             # Catalog / All Products
│   │   │   │   │   └── [slug]/
│   │   │   │   │       └── page.tsx         # Product Detail Page (PDP)
│   │   │   │   ├── categories/
│   │   │   │   │   └── [slug]/
│   │   │   │   │       └── page.tsx         # Category listing
│   │   │   │   ├── cart/
│   │   │   │   │   └── page.tsx             # Shopping cart
│   │   │   │   ├── checkout/
│   │   │   │   │   ├── page.tsx             # Checkout form
│   │   │   │   │   └── confirmation/
│   │   │   │   │       └── page.tsx         # Order confirmation
│   │   │   │   └── orders/
│   │   │   │       └── [orderNumber]/
│   │   │   │           └── page.tsx         # Public order tracking
│   │   │   └── admin/                       # Admin routes (protected)
│   │   │       ├── layout.tsx               # Admin sidebar layout
│   │   │       ├── page.tsx                 # Dashboard overview
│   │   │       ├── products/
│   │   │       │   ├── page.tsx             # Product list
│   │   │       │   ├── new/
│   │   │       │   │   └── page.tsx         # Create product
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx         # Edit product + AI research panel
│   │   │       ├── orders/
│   │   │       │   ├── page.tsx             # Order list
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx         # Order detail
│   │   │       ├── inventory/
│   │   │       │   └── page.tsx             # Inventory management
│   │   │       ├── invoices/
│   │   │       │   ├── page.tsx             # Invoice list
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx         # Invoice detail / PDF
│   │   │       ├── customers/
│   │   │       │   └── page.tsx             # Customer list
│   │   │       ├── shipping/
│   │   │       │   └── page.tsx             # Shipping zones config
│   │   │       ├── reports/
│   │   │       │   └── page.tsx             # Sales / Inventory reports
│   │   │       └── settings/
│   │   │           └── page.tsx             # Store settings
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts             # NextAuth handler
│   │       ├── products/
│   │       │   └── route.ts                 # CRUD
│   │       ├── orders/
│   │       │   ├── route.ts                 # Create / List
│   │       │   └── [id]/
│   │       │       └── route.ts             # Update status
│   │       ├── cart/
│   │       │   └── route.ts                 # Cart operations
│   │       ├── checkout/
│   │       │   └── route.ts                 # Process checkout
│   │       ├── invoices/
│   │       │   └── route.ts                 # Generate / Send
│   │       ├── shipping/
│   │       │   └── calculate/
│   │       │       └── route.ts             # Calculate shipping cost
│   │       ├── payments/
│   │       │   ├── stripe/
│   │       │   │   └── webhook/
│   │       │   │       └── route.ts         # Stripe webhook
│   │       │   └── paypal/
│   │       │       └── webhook/
│   │       │           └── route.ts         # PayPal webhook
│   │       ├── whatsapp/
│   │       │   ├── send/
│   │       │   │   └── route.ts             # Send message
│   │       │   └── webhook/
│   │       │       └── route.ts             # Incoming messages
│   │       └── ai/                          # Admin-only AI endpoints
│   │           ├── vision/
│   │           │   └── route.ts             # Upload image → Vision API
│   │           ├── research/
│   │           │   └── route.ts             # Perplexity product research
│   │           ├── pricing/
│   │           │   └── route.ts             # Market price discovery
│   │           └── images/
│   │               └── route.ts             # Google Image search
│   ├── components/
│   │   ├── ui/                              # Reusable primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── DataTable.tsx
│   │   ├── store/                           # Public store components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGallery.tsx
│   │   │   ├── CartDrawer.tsx
│   │   │   ├── CheckoutForm.tsx
│   │   │   ├── PaymentMethodSelector.tsx
│   │   │   ├── WhatsAppButton.tsx
│   │   │   └── LanguageSwitcher.tsx
│   │   └── admin/                           # Admin components
│   │       ├── Sidebar.tsx
│   │       ├── DashboardStats.tsx
│   │       ├── ProductForm.tsx
│   │       ├── AIResearchPanel.tsx
│   │       ├── InventoryTable.tsx
│   │       ├── OrderTimeline.tsx
│   │       ├── InvoicePreview.tsx
│   │       ├── ReportChart.tsx
│   │       └── ShippingZoneEditor.tsx
│   ├── lib/
│   │   ├── prisma.ts                        # Prisma client singleton
│   │   ├── auth.ts                          # NextAuth config
│   │   ├── stripe.ts                        # Stripe client
│   │   ├── whatsapp.ts                      # WhatsApp API helpers
│   │   ├── ai/
│   │   │   ├── vision.ts                    # Google Vision wrapper
│   │   │   ├── perplexity.ts                # Perplexity API wrapper
│   │   │   ├── image-search.ts              # Google CSE Image wrapper
│   │   │   └── pricing-engine.ts            # Price estimation algorithm
│   │   ├── shipping.ts                      # Shipping cost calculator
│   │   ├── invoice.ts                       # PDF generation (jsPDF / react-pdf)
│   │   └── utils.ts                         # Formatting, currency helpers
│   ├── hooks/
│   │   ├── useCart.ts                        # Cart state (Zustand)
│   │   ├── useLocale.ts                     # Locale helpers
│   │   └── useToast.ts                      # Toast notifications
│   ├── stores/
│   │   └── cart-store.ts                    # Zustand cart store
│   ├── i18n/
│   │   ├── request.ts                       # next-intl request config
│   │   └── routing.ts                       # locale routing config
│   └── messages/
│       ├── en.json                          # English translations
│       └── es.json                          # Spanish translations
├── .env.local                               # Local env vars (see §6)
├── package.json
└── tsconfig.json
```

---

## 6. External Service Directory

| Service | Function in Cabox | Account Type | Dashboard URL |
|---------|-------------------|-------------|---------------|
| **Stripe** | Credit card payment processing (Checkout Sessions, webhooks) | Individual OK (business recommended for higher limits) | [dashboard.stripe.com](https://dashboard.stripe.com) |
| **PayPal** | PayPal button payments (JS SDK, IPN webhooks) | Individual OK (Business account recommended) | [developer.paypal.com](https://developer.paypal.com) |
| **Google Cloud** | Vision API (image analysis), Custom Search API (product images) | Individual OK (personal Gmail) | [console.cloud.google.com](https://console.cloud.google.com) |
| **Perplexity** | AI product research — specs, descriptions, market pricing | Individual OK | [docs.perplexity.ai](https://docs.perplexity.ai) |
| **WhatsApp** | Business Cloud API for order notifications + `wa.me` links | Individual OK (Unverified limit: 250 conv/day) | [business.facebook.com](https://business.facebook.com/latest/whatsapp_manager) |
| **Supabase** | File storage (product images, invoices, reference uploads) | Individual OK | [supabase.com/dashboard](https://supabase.com/dashboard) |
| **Sentry** | Error monitoring — client + server crash reporting, Slack alerts | Individual OK (free tier) | [sentry.io](https://sentry.io) |
| **SendGrid** | Transactional email — order confirmations, invoices, shipping | Individual OK (custom domain needed for deliverability) | [sendgrid.com](https://app.sendgrid.com) |

> [!NOTE]
> As an **individual (Unverified Business)**, Meta allows you to send up to **250 automated order notifications** (template messages) per 24 hours using the WhatsApp Cloud API. This is usually plenty for a new store. If you exceed 250 orders/day, you must complete Meta Business Verification (requires a legal entity, DBA, or tax ID) to unlock the 1K, 10K, or 100K daily limits.

---

## 7. Environment Variables

```env
# ════════════════════════════════════════════════
# CABOX — Environment Variables Template (.env.dev)
# Copy to .env.dev and fill all PLACEHOLDER values
# before running: docker compose -f docker-compose.dev.yml --env-file .env.dev up -d
# ════════════════════════════════════════════════

# ── Store Identity (PLACEHOLDER) ──────────────────
STORE_NAME="cabox"                              # Used by spawn_store.sh
NEXT_PUBLIC_STORE_NAME="Cabox"
NEXT_PUBLIC_STORE_TAGLINE="Curated Fashion"     # Displayed in footer / meta
NEXT_PUBLIC_SUPPORT_WHATSAPP="+50600000000"     # PLACEHOLDER: your WhatsApp business number

# ── Database ──────────────────────────────────────
DATABASE_URL="postgresql://cabox_user:cabox_pass@db:5432/cabox_dev?schema=public"
POSTGRES_USER="cabox_user"
POSTGRES_PASSWORD="cabox_pass"
POSTGRES_DB="cabox_dev"

# ── Auth ──────────────────────────────────────────
NEXTAUTH_SECRET="PLACEHOLDER_run_openssl_rand_-base64_32"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_EMAIL="PLACEHOLDER_admin@yourdomain.com"
ADMIN_PASSWORD_HASH="PLACEHOLDER_bcrypt_hash_of_your_password"

# ── Manual Payments (PLACEHOLDER) ─────────────────
SINPE_PHONE_NUMBER="PLACEHOLDER_+506XXXXXXXX"   # Phone number registered for SINPE Móvil
SINPE_ACCOUNT_NAME="PLACEHOLDER_Full Name"      # Exact name on SINPE account
BANK_NAME="PLACEHOLDER_Banco Nacional"           # e.g. "Banco Nacional", "BAC Credomatic"
BANK_IBAN="PLACEHOLDER_CR00 0000 0000 0000 0000 00"  # Full IBAN
BANK_ACCOUNT_NAME="PLACEHOLDER_Full Name"        # Exact name on bank account

# ── Stripe ────────────────────────────────────────
STRIPE_SECRET_KEY="PLACEHOLDER_sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="PLACEHOLDER_pk_test_..."
STRIPE_WEBHOOK_SECRET="PLACEHOLDER_whsec_..."

# ── PayPal ────────────────────────────────────────
NEXT_PUBLIC_PAYPAL_CLIENT_ID="PLACEHOLDER_..."
PAYPAL_CLIENT_SECRET="PLACEHOLDER_..."
PAYPAL_MODE="sandbox"                           # Change to "live" for production

# ── Google APIs ───────────────────────────────────
GOOGLE_CLOUD_VISION_API_KEY="PLACEHOLDER_..."
GOOGLE_CSE_API_KEY="PLACEHOLDER_..."
GOOGLE_CSE_SEARCH_ENGINE_ID="PLACEHOLDER_..."

# ── Perplexity ────────────────────────────────────
PERPLEXITY_API_KEY="PLACEHOLDER_pplx-..."

# ── WhatsApp Business Cloud API ───────────────────
WHATSAPP_PHONE_NUMBER_ID="PLACEHOLDER_..."      # From Meta Developer Portal
WHATSAPP_ACCESS_TOKEN="PLACEHOLDER_..."         # System User Token or temporary token
WHATSAPP_VERIFY_TOKEN="PLACEHOLDER_random_string_you_choose"
WHATSAPP_BUSINESS_ACCOUNT_ID="PLACEHOLDER_..."

# ── Supabase Storage ──────────────────────────────
SUPABASE_URL="PLACEHOLDER_https://xxx.supabase.co"
SUPABASE_ANON_KEY="PLACEHOLDER_..."
SUPABASE_SERVICE_ROLE_KEY="PLACEHOLDER_..."

# ── App ───────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_DEFAULT_LOCALE="es"
NEXT_PUBLIC_CURRENCY="CRC"

# ── Meta / Social Commerce ────────────────────────
NEXT_PUBLIC_META_PIXEL_ID="PLACEHOLDER_..."
META_CAPI_ACCESS_TOKEN="PLACEHOLDER_..."
META_CAPI_PIXEL_ID="PLACEHOLDER_..."

# ── Error Monitoring ──────────────────────────────
SENTRY_DSN="PLACEHOLDER_https://xxx@xxx.ingest.sentry.io/xxx"
SENTRY_AUTH_TOKEN="PLACEHOLDER_..."
NEXT_PUBLIC_SENTRY_DSN="PLACEHOLDER_https://xxx@xxx.ingest.sentry.io/xxx"

# ── Transactional Email ───────────────────────────
SENDGRID_API_KEY="PLACEHOLDER_SG.xxx"
EMAIL_FROM="Cabox <PLACEHOLDER_orders@yourdomain.com>"

# ── Rate Limiting (Upstash Redis) ─────────────────
UPSTASH_REDIS_REST_URL="PLACEHOLDER_https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="PLACEHOLDER_..."
```

---

## 8. Core API Contracts

### 7.1 Public Store APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/products?category=&search=&page=` | Paginated product list (includes active promo prices) |
| `GET` | `/api/products/[slug]` | Single product with images, variants & active promotions |
| `POST` | `/api/cart` | Create/update cart (session-based) |
| `POST` | `/api/cart/validate` | **Re-validate cart prices** against current DB (price-change guard) |
| `POST` | `/api/checkout` | Process checkout → create Order (with final price verification) |
| `POST` | `/api/coupons/apply` | Validate & apply coupon code `{ code, cartTotal }` → returns discount |
| `GET` | `/api/promotions/active` | List active promotions/banners for storefront display |
| `GET` | `/api/orders/[orderNumber]` | Public order tracking |
| `POST` | `/api/shipping/calculate` | Calculate shipping from `{ items, address }` |
| `POST` | `/api/payments/stripe/webhook` | Stripe payment confirmation |
| `POST` | `/api/payments/paypal/webhook` | PayPal IPN |
| `GET` | `/api/feeds/meta` | Auto-generated XML feed for Facebook/Instagram Shop |
| `GET` | `/api/feeds/google` | Auto-generated XML feed for Google Merchant Center |
| `POST` | `/api/tracking/meta-capi` | Server-side proxy for Meta Conversions API events |

### 7.2 Admin APIs (Auth Required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/products` | Create product |
| `PUT` | `/api/products/[id]` | Update product (auto-logs price changes to `PriceChangeLog`) |
| `DELETE` | `/api/products/[id]` | Archive product |
| `POST` | `/api/products/bulk-reprice` | Bulk price update for category/tag (admin recalculation) |
| `GET` | `/api/orders` | All orders with filters |
| `PATCH` | `/api/orders/[id]` | Update order/payment status |
| `POST` | `/api/invoices` | Generate invoice PDF |
| `GET/POST/PUT/DELETE` | `/api/promotions` | Full CRUD for seasonal promotions |
| `GET/POST/PUT/DELETE` | `/api/coupons` | Full CRUD for coupon codes |
| `GET` | `/api/price-history/[productId]` | View price change audit trail |
| `POST` | `/api/ai/vision` | Upload reference image → extract labels |
| `POST` | `/api/ai/research` | Query Perplexity for product specs |
| `POST` | `/api/ai/pricing` | Get market prices from major platforms |
| `POST` | `/api/ai/images` | Fetch promotional images |
| `POST` | `/api/whatsapp/send` | Send order notification |

---

## 9. Key Implementation Details

### 8.1 Cart Architecture
- **Storage**: Client-side via Zustand store persisted to `localStorage`.
- **Guest checkout only** (no customer accounts needed — fashion curated store model).
- Cart items contain snapshot data (price, name, image) to avoid stale lookups.

### 8.2 Checkout Flow
```
Cart → Customer Info Form → Shipping Address → Payment Selection → Order Confirmation
                                    ↓
                          [Auto-calculate shipping]
```
- **Credit Card**: Stripe Checkout Session (redirect) or Stripe Elements (embedded).
- **PayPal**: PayPal JS SDK button embedded inline.
- **SINPE / Cash / Bank Transfer**: Display instructions + reference number; order set to `PENDING` until admin manually confirms payment.

### 8.3 AI Research Pipeline (Admin)
```
Upload Reference Image
        ↓
  Google Vision API  →  labels, text, dominant colors
        ↓
  Feed into Perplexity  →  "Given these labels: [X], find product specs, 
                            descriptions in EN and ES, and prices on Amazon/eBay/Alibaba"
        ↓
  Parse structured response → populate ProductReference record
        ↓
  Google Custom Search Image API → fetch 6-10 promo images
        ↓
  Admin reviews and selects → attach to Product
```

### 8.4 Pricing Engine
```typescript
interface PricingInput {
  marketPrices: { source: string; price: number; currency: string }[];
  shippingFromSource: number;  // estimated intl shipping
  customsDutyPct: number;      // Costa Rica import duty %
  marginPct: number;           // desired profit margin %
  exchangeRate?: number;       // USD → CRC
}

function estimatePrice(input: PricingInput): {
  avgMarketPrice: number;
  landedCost: number;          // market + shipping + customs
  suggestedRetail: number;     // landed * (1 + margin)
  suggestedRetailCRC: number;
}
```

### 8.5 Shipping Calculator
```typescript
function calculateShipping(params: {
  items: { weight: number; dimensions: { l: number; w: number; h: number } }[];
  destinationProvince: string;   // Costa Rica province
}): {
  method: string;
  cost: number;
  estimatedDays: string;         // "2-4 días hábiles"
  isFreeShipping: boolean;
}
```
- Uses `ShippingZone` records from DB.
- Calculates volumetric weight: `(L × W × H) / 5000`.
- Uses `max(actual_weight, volumetric_weight)` for cost.
- Applies free shipping if order total exceeds zone's `freeAbove` threshold.

### 8.6 Pricing Verification, Discounts & Promotions Engine

#### 8.6.1 Price-Change Guard (Open Orders Protection)

When a product price changes, existing orders must not be affected:

```
Admin updates product price
        ↓
  PriceChangeLog record created automatically (audit trail)
        ↓
  OrderItems already use SNAPSHOT prices (locked at checkout time)
        ↓
  Order.priceSnapshot JSON stores full cart state at checkout
        ↓
  ✅ Existing PENDING/CONFIRMED orders are NEVER recalculated
  ✅ Only the customer's active CART sees new prices (via revalidation)
```

**Cart Revalidation Flow**:
```typescript
// POST /api/cart/validate — called on:
//   1. Cart page load
//   2. Checkout page entry
//   3. Every 5 minutes while cart is open (background polling)

async function validateCart(cartItems: CartItem[]): Promise<{
  valid: boolean;
  changes: {
    productId: string;
    field: 'price' | 'stock' | 'status';
    oldValue: any;
    newValue: any;
    messageEn: string;
    messageEs: string;
  }[];
  updatedItems: CartItem[];  // items with corrected prices
}>
```

- If price changed: show toast "Price updated for {product}" and update cart automatically.
- If product archived/out-of-stock: show warning and remove from cart.
- At checkout, **final validation is mandatory** — order cannot proceed with stale prices.

#### 8.6.2 Promotion Engine

```typescript
interface PromotionResult {
  applicablePromotions: {
    id: string;
    nameEn: string;
    nameEs: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y' | 'FREE_SHIPPING';
    discountAmount: number;   // calculated discount for this cart
    affectedItems: string[];  // product IDs that qualify
  }[];
  bestDiscount: number;       // if non-stackable, the highest single discount
  totalDiscount: number;      // if stackable, the sum
  freeShipping: boolean;
}

function evaluatePromotions(params: {
  items: { productId: string; categoryId: string; price: number; qty: number }[];
  cartTotal: number;
  currentDate: Date;
}): PromotionResult
```

**Rules**:
- Promotions are **time-bound** (`startsAt` → `endsAt`) and auto-activate/deactivate via query filters.
- Non-stackable promotions: only the highest-priority (or largest discount) applies.
- Stackable promotions: all qualifying promos accumulate.
- `BUY_X_GET_Y`: cheapest qualifying item is free.
- `FREE_SHIPPING`: overrides shipping cost to 0.

#### 8.6.3 Coupon System

```typescript
// POST /api/coupons/apply
async function applyCoupon(params: {
  code: string;
  cartTotal: number;
  customerPhone?: string;  // for per-customer usage limits
}): Promise<{
  valid: boolean;
  error?: 'EXPIRED' | 'INVALID' | 'MIN_NOT_MET' | 'MAX_USES_REACHED' | 'ALREADY_USED';
  errorMessageEn?: string;
  errorMessageEs?: string;
  discount?: number;
  coupon?: { code: string; descriptionEn: string; descriptionEs: string };
}>
```

**Rules**:
- One coupon per order (coupons do NOT stack with each other).
- Coupons CAN stack with automatic promotions (e.g., "Summer Sale" + coupon code).
- `maxUses` is global; `maxUsesPerCustomer` is tracked by phone number.
- Coupon is validated at apply-time AND re-validated at checkout-time.

#### 8.6.4 Social Commerce & Conversions API (CAPI)

Relying solely on client-side Meta Pixels means losing 20-30% of purchase data due to ad blockers and iOS tracking prevention.

**Strategy**: `Hybrid Tracking`
1. **Frontend (Browser)**: Standard Meta Pixel tracks `PageView`, `ViewContent`, and `AddToCart`.
2. **Backend (Server)**: `/api/checkout` triggers the **Meta Conversions API (CAPI)** directly from the Node.js server to log `Purchase` events. Both client and server send the same deduplication ID (e.g., `orderNumber`) so Meta merges them accurately.

#### 8.6.5 XML Product Feeds (Instagram/Facebook/Google Shopping)

Store products must be discoverable on social surfaces.

```typescript
// GET /api/feeds/meta — outputs RSS/XML format
// Used by Meta Commerce Manager to sync the Facebook & Instagram Shop
```
- Feed auto-generates nightly or is pulled on-demand by Meta/Google.
- Includes `<g:id>`, `<g:title>`, `<g:description>`, `<g:link>`, `<g:image_link>`, `<g:price>`, `<g:availability>`.
- **Locale handling**: Generates distinct feeds for `?locale=es` and `?locale=en`.

#### 8.6.6 Price Recalculation (Admin Tool)

```typescript
// POST /api/products/bulk-reprice
async function bulkReprice(params: {
  scope: 'category' | 'tag' | 'all';
  scopeValue?: string;          // category ID or tag name
  strategy: 'margin' | 'markup' | 'competitive';
  value: number;                // margin %, markup %, or competitive adjustment %
  roundTo?: number;             // round to nearest (e.g., 500 CRC → prices end in 500)
  dryRun: boolean;              // preview without applying
}): Promise<{
  affected: { productId: string; sku: string; oldPrice: number; newPrice: number }[];
  totalProducts: number;
}>
```

- **Margin strategy**: `newPrice = costPrice / (1 - marginPct)`
- **Markup strategy**: `newPrice = costPrice * (1 + markupPct)`
- **Competitive strategy**: `newPrice = avgMarketPrice * (1 + adjustmentPct)`
- All changes are logged to `PriceChangeLog` with reason "Bulk reprice".
- `dryRun: true` returns preview without saving.

#### 8.6.5 Storefront Promo Display

- Active promotions with `bannerImageUrl` appear as a carousel on the home page.
- Product cards show:
  - Original price with ~~strikethrough~~ when promotion applies.
  - Sale badge with discount percentage.
  - Countdown timer if promotion ends within 48 hours.
- Coupon input field on cart/checkout page.

### 8.7 WhatsApp Integration
- **Customer → Store**: "Order via WhatsApp" button opens `https://wa.me/{number}?text={pre-filled message with cart summary}`.
- **Store → Customer** (Admin): Automated messages via WhatsApp Cloud API:
  - Order confirmation
  - Payment received
  - Shipment tracking
  - Delivery confirmation

### 8.7 Invoicing
- Admin clicks "Generate Invoice" on any order.
- System creates `Invoice` record with line-item snapshots.
- PDF rendered server-side using `@react-pdf/renderer`.
- PDF stored in Supabase Storage at `invoices/{invoiceNumber}.pdf`.
- Can be sent to customer email and/or WhatsApp.

### 8.8 Reporting Dashboard
| Report | Description |
|--------|-------------|
| Sales Overview | Revenue by day/week/month, order count, avg order value |
| Top Products | Best sellers by quantity and revenue |
| Inventory Value | Total stock value at cost and retail price |
| Payment Methods | Breakdown by payment method |
| Shipping | Orders by province, shipping costs |
| Customer Insights | Repeat customers, order frequency |

Charts via `recharts` library.

---

## 10. Missing Functionalities — Identified & Addressed

> [!IMPORTANT]
> These were **gaps in the original plan** that are now incorporated above:

| # | Gap | Resolution |
|---|-----|------------|
| 1 | **No database schema** | Full Prisma schema with all models (§4) |
| 2 | **No file structure** | Complete file tree with every route (§5) |
| 3 | **No API contracts** | Full endpoint table with methods and payloads (§7) |
| 4 | **No auth strategy** | NextAuth.js v5 with admin-only credentials (§3, §5) |
| 5 | **No env variables** | Complete `.env.local` template (§6) |
| 6 | **No deployment target** | Docker-centric: `Dockerfile.dev/.prd`, `docker-compose.dev/.prd.yml`, multi-store `spawn_store.sh` (§3.11) |
| 7 | **No order tracking** | Public order status page via `/orders/[orderNumber]` (§5) |
| 8 | **No customer model** | `Customer` model with phone as primary ID (§4) |
| 9 | **No cart architecture** | Zustand + localStorage, guest checkout (§8.1) |
| 10 | **No checkout flow** | Step-by-step flow with payment branching (§8.2) |
| 11 | **No pricing algorithm** | `estimatePrice()` function spec (§8.4) |
| 12 | **No shipping formula** | Volumetric weight calculation + zone rates (§8.5) |
| 13 | **No invoice PDF generation** | `@react-pdf/renderer` + Supabase storage (§8.8) |
| 14 | **No reporting spec** | 6 report types with chart library (§8.9) |
| 15 | **No product variants** | `ProductVariant` model with attributes JSON (§4) |
| 16 | **No category hierarchy** | Self-referencing `Category` model (§4) |
| 17 | **Brand identity not extracted** | Full color palette + typography from logo (§2) |
| 18 | **No discount/coupon system** | `Promotion` + `Coupon` models, evaluation engine, coupon validation API (§4, §8.6) |
| 19 | **No seasonal promotions** | Time-bound `Promotion` with auto-activate/deactivate, storefront banners + countdown (§8.6) |
| 20 | **No price-change protection** | `PriceChangeLog` audit trail + `Order.priceSnapshot` + cart revalidation API (§8.6.1) |
| 21 | **No bulk repricing tool** | `/api/products/bulk-reprice` with dry-run, margin/markup/competitive strategies (§8.6.6) |
| 22 | **Invoice PDF language unclear** | `Order.locale` field added; PDF renders in customer's locale at checkout (§3.4, §4) |
| 23 | **WhatsApp templates not bilingual** | EN + ES versions of each template required for Meta approval (§3.4) |
| 24 | **SEO not locale-aware** | `hreflang` tags, locale-specific OG tags, JSON-LD in customer locale (§3.4) |
| 25 | **Admin language scope undefined** | Admin dashboard is English-only, outside `[locale]` routing (§3.4, §3.6) |
| 26 | **No social commerce feeds** | Auto-generating XML feeds (`/api/feeds/meta`) for IG/FB/Google Shopping added (§3.8, §8.6.5) |
| 27 | **Purchase tracking inaccurate** | Added Meta Conversions API (CAPI) server-side tracking to bypass ad blockers (§3.8, §8.6.4) |
| 28 | **Under-utilizing WhatsApp** | Expanded to full CRM strategy (Cart Recovery, Buy via WA CTAs, conversational routing) (§8.7) |
| 29 | **No rate limiting** | `@upstash/ratelimit` on checkout, coupon, and AI endpoints with per-IP/per-user limits (§14.1) |
| 30 | **No error monitoring** | `@sentry/nextjs` for client + server errors, Slack alerts for critical failures (§14.2) |
| 31 | **No transactional email** | SendGrid + React Email templates for order/payment/shipping confirmations (§14.3) |
| 32 | **No security headers** | CSP, HSTS, X-Frame-Options, Referrer-Policy configured in `next.config.mjs` (§14.4) |
| 33 | **No caching strategy** | ISR per page type (30s-3600s) + client-side SWR for real-time data (§14.5) |
| 34 | **No backup strategy** | Supabase daily snapshots + PITR + pre-migration `pg_dump` policy (§14.6) |
| 35 | **Not containerized** | Full Docker-centric: env-suffixed files (`.dev`/`.prd`), multi-store spawning via `spawn_store.sh` (§3.11) |

---

## 11. Phased Development Plan

### Phase 1 — Docker Scaffolding & Design System (Days 1–2)
- [ ] Create `Dockerfile.dev` (Node.js + hot-reload dev server)
- [ ] Create `docker-compose.dev.yml` (Next.js app + PostgreSQL 16 + Redis 7, parameterized ports)
- [ ] Create `.env.dev` with all environment variables
- [ ] Create `templates/env.dev.template` for multi-store spawning
- [ ] Create `spawn_store.sh` (spawn new store in 1 command)
- [ ] Create `nginx/default.dev.conf` (simple reverse proxy)
- [ ] `docker compose -f docker-compose.dev.yml --env-file .env.dev up -d` — verify stack boots
- [ ] `npx create-next-app` inside container with `output: 'standalone'` in `next.config.mjs`
- [ ] Configure PWA (`@ducanh2912/next-pwa`, manifest, icons from logo)
- [ ] Set up Tailwind with brand tokens from §2
- [ ] Configure `next-intl` with `/en` and `/es` routing
- [ ] Initialize Prisma with full schema from §4
- [ ] `docker compose -f docker-compose.dev.yml exec app npx prisma migrate dev` — verify schema
- [ ] Create seed script with sample categories + 5 demo products
- [ ] Build shared UI components (`Button`, `Input`, `Card`, `Badge`, `Modal`, `Toast`)
- [ ] Create `LanguageSwitcher` component

### Phase 2 — Public Storefront (Days 3–5)
- [ ] Store layout: `Navbar` (logo, search, cart icon, language) + `Footer`
- [ ] Home page: Hero banner, featured products grid, category cards
- [ ] Product catalog page with filters (category, price range, search)
- [ ] Product detail page (gallery, variants, add to cart, WhatsApp button)
- [ ] Cart page/drawer with quantity adjustment, totals, and **coupon code input**
- [ ] Implement Zustand cart store with localStorage persistence
- [ ] **Cart revalidation** — `/api/cart/validate` endpoint + polling on cart/checkout
- [ ] **Promotion display** — sale badges, strikethrough prices, countdown timers
- [ ] Build all required `/api/products` endpoints

### Phase 3 — Checkout & Payments (Days 6–8)
- [ ] Checkout page: customer info → shipping → payment method → confirm
- [ ] Shipping calculator endpoint + UI integration
- [ ] Stripe integration (Checkout or Elements)
- [ ] PayPal SDK integration
- [ ] Manual payment flow (SINPE, Transfer, Cash) with instructions display
- [ ] Order confirmation page
- [ ] Order tracking page (public, by order number)
- [ ] Create ShippingZone seed data for Costa Rica provinces

### Phase 4 — Admin Dashboard (Days 9–13)
- [ ] NextAuth.js setup (credentials provider, admin-only)
- [ ] Admin layout with sidebar navigation
- [ ] Dashboard overview (stats cards, recent orders, low stock alerts)
- [ ] Product CRUD (list, create, edit, archive) with price change logging
- [ ] Product image upload via Supabase Storage
- [ ] **Promotions manager** (create/edit/schedule seasonal promotions, toggle active)
- [ ] **Coupons manager** (create codes, set limits/expiry, usage tracking)
- [ ] **Bulk repricing tool** (by category/tag, margin/markup/competitive, dry-run preview)
- [ ] **Price history viewer** (audit trail per product)
- [ ] Order management (list, view detail, update status/payment)
- [ ] Inventory management page (stock levels, adjustments)
- [ ] Customer list page
- [ ] Shipping zones configuration page

### Phase 5 — AI Integration (Days 13–15)
- [ ] `AIResearchPanel` component on product edit page
- [ ] Google Cloud Vision API wrapper + upload endpoint
- [ ] Perplexity API wrapper + research endpoint
- [ ] Google Custom Search Image API wrapper + endpoint
- [ ] Pricing engine implementation
- [ ] UI: display AI results, allow admin to apply specs/images/prices

### Phase 6 — WhatsApp CRM, Feeds & Invoicing (Days 16–18)
- [ ] WhatsApp Cloud API wrapper
- [ ] "Buy via WhatsApp" buttons on product catalog and PDP
- [ ] Admin: WhatsApp cart recovery 1-click links
- [ ] Admin: Automated order notifications via WhatsApp templates
- [ ] **XML Product Feeds** (`/api/feeds/meta` and `/api/feeds/google`)
- [ ] **Meta Conversions API (CAPI)** integration on checkout success route
- [ ] Invoice generation (`@react-pdf/renderer`)
- [ ] Invoice list + preview + PDF download
- [ ] Reports page with 6 chart panels (recharts)

### Phase 7 — Polish & Launch (Days 19–21)
- [ ] Lighthouse PWA audit (target >90 on all categories)
- [ ] SEO: meta tags, Open Graph, `hreflang`, structured data (Product schema)
- [ ] Responsive design audit (mobile, tablet, desktop)
- [ ] Error boundaries and loading states on all pages
- [ ] 404 and error pages (bilingual)
- [ ] **Create `Dockerfile.prd`** (multi-stage standalone production build)
- [ ] **Create `docker-compose.prd.yml`** (app + postgres + redis + nginx with SSL)
- [ ] **Create `.env.prd`** from `.env.dev` with production values
- [ ] **Create `nginx/default.prd.conf`** (reverse proxy with Let's Encrypt SSL)
- [ ] `docker compose -f docker-compose.prd.yml --env-file .env.prd up -d --build` — verify
- [ ] Run production smoke tests (E2E suite against production container)
- [ ] Database backup policy verification (`pg_dump` dry run)
- [ ] Test multi-store spawning: `./spawn_store.sh teststore 3100 5433 6380`

---

## 12. Verification Plan

### Automated Tests
```bash
# Unit tests — pricing engine, shipping calculator, cart logic
npm run test

# E2E — full checkout flow in both locales
npx playwright test
```

- **Unit Tests**: `vitest` for pricing engine (`pricing-engine.test.ts`), shipping calculator (`shipping.test.ts`), and cart store (`cart-store.test.ts`).
- **E2E Tests**: Playwright suite covering:
  - Browse catalog → add to cart → checkout (EN and ES)
  - Admin login → create product → AI research → publish
  - Order lifecycle: create → confirm payment → ship → deliver

### Manual Verification
1. **PWA Install Test**: Open on mobile Chrome → verify "Add to Home Screen" prompt appears and app works offline.
2. **Payment Flow**: Test each payment method (Stripe test cards, PayPal sandbox, manual SINPE).
3. **WhatsApp**: Send a test order notification and verify it arrives on the business WhatsApp number.
4. **Bilingual**: Navigate entire store in ES, switch to EN, verify all content switches without page reload.
5. **Lighthouse**: Run `npx lighthouse http://localhost:3000 --view` and verify PWA score ≥90.

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Perplexity API rate limits | AI research blocked | Cache results in `ProductReference`; implement retry with exponential backoff |
| Google Vision API costs | Budget overrun | Limit image analysis to admin-triggered only; cache aggressively |
| WhatsApp API limits | 250 msgs/day isn't enough as store scales | Complete Meta Business Verification (requires tax ID or legal entity) to unlock 1K+ daily limits |
| SINPE lacks API | No automation | Manual confirmation flow; admin marks payment as received |
| Costa Rica shipping complexity | Inaccurate estimates | Start with flat provincial zones; refine with real carrier data later |
| Checkout abuse / bots | Fraudulent orders, coupon scraping | Rate limiting via `@upstash/ratelimit` on all public mutation endpoints |
| Production crashes invisible | Lost sales, silent failures | Sentry error monitoring with Slack alerts for critical errors |
| Email deliverability | Confirmations go to spam | Use SendGrid (dedicated sending domain) with SPF/DKIM/DMARC |

---

## 14. Production Infrastructure (Non-Negotiable)

These are the systems that separate a toy project from a **production-grade eCommerce operation**:

### 14.1 Rate Limiting (`@upstash/ratelimit`)

| Endpoint | Limit | Key |
|----------|-------|-----|
| `POST /api/checkout` | 5 req/min | IP address |
| `POST /api/coupons/apply` | 10 req/min | IP address |
| `POST /api/cart/validate` | 20 req/min | IP address |
| `POST /api/ai/*` | 10 req/hour | Admin user ID |
| `POST /api/whatsapp/send` | 30 req/hour | Admin user ID |

Uses Upstash Redis (serverless, free tier covers MVP traffic). Implemented as Next.js middleware.

### 14.2 Error Monitoring (`@sentry/nextjs`)

- **Client-side**: Captures React rendering errors, unhandled promise rejections, and failed network requests.
- **Server-side**: Captures API route errors, Prisma query failures, and payment webhook errors.
- **Alerts**: Sentry → Slack webhook for `fatal` and `error` level events.
- **Source maps**: Uploaded at build time for readable stack traces in production.

### 14.3 Transactional Email (`@sendgrid/mail`)

WhatsApp is the primary channel, but email is the **fallback** and **legal record**:

| Trigger | Email Sent | Template |
|---------|-----------|----------|
| Order placed | Order confirmation with summary | `order-confirmation.tsx` |
| Payment confirmed | Payment receipt | `payment-receipt.tsx` |
| Order shipped | Tracking link | `shipment-notification.tsx` |
| Invoice generated | Invoice PDF attachment | `invoice-delivery.tsx` |

- Uses React Email templates (`@react-email/components`) for type-safe, beautiful HTML emails.
- All templates render in the customer's `Order.locale` (EN or ES).

### 14.4 Security Headers

Configured in `next.config.mjs`:

```
Content-Security-Policy:     default-src 'self'; script-src 'self' 'unsafe-inline' https://connect.facebook.net https://www.paypal.com; img-src 'self' data: https://*.supabase.co; frame-src https://js.stripe.com https://www.paypal.com;
Strict-Transport-Security:   max-age=31536000; includeSubDomains
X-Content-Type-Options:      nosniff
X-Frame-Options:             DENY
Referrer-Policy:             strict-origin-when-cross-origin
Permissions-Policy:          camera=(), microphone=(), geolocation=()
```

### 14.5 Caching Strategy (ISR + SWR)

| Page | Strategy | Revalidation |
|------|----------|-------------|
| Home page | ISR | 60 seconds |
| Product catalog | ISR | 60 seconds |
| Product detail (PDP) | ISR | 30 seconds (price-sensitive) |
| Category pages | ISR | 120 seconds |
| Cart / Checkout | Dynamic (no cache) | Real-time |
| Admin pages | Dynamic (no cache) | Real-time |
| Product feeds (XML) | ISR | 3600 seconds (hourly) |

- **ISR** (Incremental Static Regeneration): Product pages are pre-rendered at build time and regenerated in the background. First visitor gets static HTML (fast), subsequent visitors get updated data.
- **SWR** on client: `useSWR` for cart validation and promotion checks to ensure freshness without full page reloads.

### 14.6 Database Backups

- **Supabase automatic backups**: Daily snapshots retained for 7 days (free tier) or 30 days (Pro).
- **Point-in-time recovery (PITR)**: Available on Supabase Pro plan — restores to any second within the retention window.
- **Pre-deployment safety**: Before any Prisma migration, run `pg_dump` to a local backup file.
- **Seed script**: `prisma/seed.ts` allows full dev environment recreation from scratch at any time.

---

## 15. Scalability Safeguards

> [!IMPORTANT]
> These safeguards are **built into the initial implementation** — not deferred. They prevent the classic problem of rewriting a successful store once it grows past its original capacity.

### 15.1 Database Connection Pooling (PgBouncer)

Prisma creates a new DB connection per serverless invocation. Without pooling, PostgreSQL will hit its connection limit (`max_connections = 100` by default) at ~20+ concurrent users.

**Solution**: Add `pgbouncer` as a sidecar service in `docker-compose.dev.yml` and `docker-compose.prd.yml`:

```yaml
  pgbouncer:
    image: edoburu/pgbouncer:latest
    environment:
      DATABASE_URL: postgresql://cabox_user:cabox_pass@db:5432/cabox_dev
      POOL_MODE: transaction          # Best for Next.js (short-lived requests)
      MAX_CLIENT_CONN: 100            # Max clients connecting to pgbouncer
      DEFAULT_POOL_SIZE: 20           # Actual connections to PostgreSQL
    ports:
      - "${PGBOUNCER_PORT:-6432}:5432"
    depends_on:
      - db
```

**Update `DATABASE_URL`** to point at PgBouncer instead of Postgres directly:

```env
DATABASE_URL="postgresql://cabox_user:cabox_pass@pgbouncer:5432/cabox_dev?pgbouncer=true"
```

> The Prisma datasource also needs `connection_limit=1` per worker when using PgBouncer in transaction mode — Next.js handles this automatically with the `?pgbouncer=true` query param.

### 15.2 Database Indices (Performance at Scale)

The Prisma schema (§4) already includes `@@index` directives on all high-traffic query patterns:

| Model | Indexed Fields | Why |
|-------|---------------|-----|
| `Product` | `categoryId`, `status`, `featured`, `createdAt DESC` | Catalog list, featured grid, admin sort |
| `Product` | GIN full-text (via raw migration) | Product search (replaces `LIKE %...%`) |
| `Customer` | `phone`, `email` | WhatsApp lookup, returning customer detection |
| `Order` | `customerId`, `status`, `paymentStatus`, `createdAt DESC` | Admin order list, customer order history |
| `Promotion` | `slug`, `[startsAt, endsAt]`, `isActive` | Active promotion lookup at checkout |
| `Coupon` | `code`, `[isActive, expiresAt]` | Coupon validation at checkout |
| `PriceChangeLog` | `productId`, `createdAt DESC` | Audit trail viewer |

### 15.3 Horizontal Scaling (Nginx Upstream)

The production Docker Compose is designed to scale app replicas without downtime:

```yaml
  app:
    image: cabox-app:prd
    deploy:
      replicas: 2          # Scale to 4, 8, etc. — just change this number
      restart_policy:
        condition: on-failure
```

**Nginx upstream** in `nginx/default.prd.conf` load-balances across replicas:

```nginx
upstream next_app {
  least_conn;                         # Route to least-busy replica
  server app:3000;                    # Docker Compose resolves to all replicas
  keepalive 32;                       # Reuse connections
}

server {
  listen 443 ssl;
  location / {
    proxy_pass         http://next_app;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection 'upgrade';
    proxy_cache_bypass $http_upgrade;
  }
}
```

> **Note**: Sessions are JWT-based (stateless) — any replica can handle any request without sticky sessions.

### 15.4 Image CDN Strategy (Cloudflare)

Supabase Storage serves product images. For scale, add Cloudflare as a CDN proxy layer:

```
Customer → Cloudflare CDN → Supabase Storage
          (cached at edge)  (origin)
```

**Steps (Phase 7)**:
1. Set custom domain for Supabase Storage bucket (e.g., `cdn.cabox.store`) via Cloudflare DNS CNAME.
2. Enable Cloudflare caching for `/*.webp`, `/*.jpg`, `/*.png` with TTL = 1 week.
3. Use `next/image` with `remotePatterns` pointing to `cdn.cabox.store`.

This takes image delivery from **~400ms (Supabase, no CDN)** to **~20ms (Cloudflare edge)**.

### 15.5 Async Job Queue (Background Processing)

Currently, these operations block the HTTP response:
- Invoice PDF generation (`@react-pdf/renderer`, ~500ms)
- Email sending via SendGrid (~200ms)
- WhatsApp notification via Cloud API (~300ms)

**Phase 1 solution**: Run these synchronously (acceptable for MVP).

**At scale (>200 orders/day)**: Add a lightweight Redis-backed job queue:

```typescript
// lib/queue.ts — using 'bullmq' (backed by existing Redis container)
import { Queue, Worker } from 'bullmq';

export const emailQueue = new Queue('email', { connection: redisConnection });
export const invoiceQueue = new Queue('invoice', { connection: redisConnection });
export const whatsappQueue = new Queue('whatsapp', { connection: redisConnection });

// In API route (non-blocking):
await emailQueue.add('order-confirmation', { orderId, locale });
// Returns immediately — worker processes in background
```

Worker runs as a separate service in `docker-compose.prd.yml`:

```yaml
  worker:
    image: cabox-app:prd
    command: ["node", "worker.js"]    # Separate entry point
    environment:
      - DATABASE_URL
      - SENDGRID_API_KEY
      - WHATSAPP_ACCESS_TOKEN
    depends_on:
      - redis
      - db
```

> **Zero infrastructure change** — the same Redis already running for rate limiting is reused for the job queue.

### 15.6 Growth Trigger Roadmap

| When You Hit This | Action Required |
|-------------------|----------------|
| **250 WA messages/day** | Complete Meta Business Verification to unlock 1,000/day tier |
| **500+ concurrent users** | Scale app replicas to 4+ (`docker-compose.prd.yml` → `replicas: 4`) |
| **1,000+ orders/month** | Move from synchronous email/WA to BullMQ async queue (§15.5) |
| **DB query time > 100ms** | Run `EXPLAIN ANALYZE` on slow queries; add indices as needed |
| **Second store spawned** | Update Nginx config to proxy-pass to both stores by subdomain/path |
| **AI research >500 calls/month** | Audit Google Vision + Perplexity costs; add Redis cache layer for identical research |
| **Product catalog > 1,000 items** | Add Elasticsearch or use Postgres full-text GIN index migration |

