# Cabox — Technology Stack & Development Reference

> **Last Updated**: 2026-03-21

## Frontend Technologies

### Core Framework
- **Next.js 15+**: React framework with App Router, RSC, ISR
- **React 19**: UI library with Server Components support
- **TypeScript 5.7+**: Type-safe development

### UI & Styling
- **shadcn/ui**: 50+ copy-paste components built on Radix UI
- **Tailwind CSS v4**: Utility-first CSS with brand token configuration
- **Radix UI**: Accessible UI primitives (Dialog, Select, Tabs, Toast, etc.)
- **Lucide React**: Icon library
- **Embla Carousel**: Product image galleries

### State Management
- **Zustand 5**: Client-side cart store persisted to `localStorage`
- **SWR**: Client-side data fetching with revalidation
- **React Hook Form 7 + Zod 3**: Type-safe form handling & validation

### Data Display
- **@tanstack/react-table 8**: Admin data tables (products, orders, inventory)
- **Recharts 2**: Admin dashboard charts & reports
- **react-day-picker 9**: Date range selectors for reports/promotions
- **cmdk 1**: Command palette for admin quick actions

### Auth
- **NextAuth.js v5 (Auth.js)**: Admin-only authentication
  - Provider: `CredentialsProvider` (email + bcrypt password)
  - Strategy: JWT (no database sessions)
  - Roles: `ADMIN`, `SUPER_ADMIN` in JWT claims
  - Middleware: Protects all `/admin/**` routes

### Internationalization
- **next-intl 3.20+**: Bilingual support (EN/ES)
  - Routing: URL prefixes (`/en/…`, `/es/…`)
  - Default locale: `es`
  - Admin: English-only (outside `[locale]` routing)
  - Format: ICU message syntax

### PWA
- **@ducanh2912/next-pwa**: Service worker, offline support, installability
- **Web App Manifest**: Custom icons generated from logo

## Backend Technologies

### Database & ORM
- **PostgreSQL 16** (Alpine, Docker container)
- **Prisma 6**: ORM with type-safe client
  - 18 models: User, Category, Product, ProductVariant, ProductReference, InventoryRecord, Customer, Order, OrderItem, Invoice, ShippingZone, Promotion, Coupon, PriceChangeLog
  - Migrations: `npx prisma migrate dev` (inside container)
  - Studio: `npx prisma studio` on port 5555

### API Layer
- **Next.js API Routes** (Route Handlers in App Router)
- Public endpoints: `/api/products`, `/api/checkout`, `/api/cart/validate`, `/api/feeds/*`
- Admin endpoints: `/api/products` (CRUD), `/api/orders`, `/api/ai/*`, `/api/whatsapp/*`
- Webhook endpoints: `/api/payments/stripe/webhook`, `/api/payments/paypal/webhook`

### Payments
| Method | Integration | Automation |
|--------|------------|------------|
| Credit Card | Stripe Checkout / Elements | Fully automated (webhook) |
| PayPal | PayPal JS SDK | Fully automated (webhook) |
| SINPE | Manual | Admin confirms payment |
| Bank Transfer | Manual | Admin confirms payment |
| Cash | Manual | Admin confirms on delivery |

### AI & Research APIs
| API | Purpose | Package |
|-----|---------|---------|
| Google Cloud Vision | Image label/text/color extraction | REST API |
| Perplexity (sonar-pro) | Product specs, descriptions, pricing | REST API |
| Google Custom Search | Promotional product images | REST API |

### Communication
- **WhatsApp Business Cloud API**: Outbound order notifications (pre-approved templates in EN/ES)
- **wa.me links**: Customer-initiated contact (zero API needed)
- **SendGrid**: Transactional email (order confirmation, invoices)
- **@react-email/components**: Type-safe HTML email templates

### File Storage
- **Supabase Storage**: Product images, reference uploads, invoice PDFs
  - Products: `products/{productId}/{position}.webp`
  - References: `references/{productId}/original.{ext}`
  - Invoices: `invoices/{invoiceNumber}.pdf`

### PDF Generation
- **@react-pdf/renderer 4**: Server-side invoice PDF rendering

## Production Infrastructure

### Rate Limiting
- **@upstash/ratelimit**: Per-endpoint limits via Redis
  - Checkout: 5 req/min per IP
  - Coupon apply: 10 req/min per IP
  - AI endpoints: 10 req/hour per admin

### Error Monitoring
- **@sentry/nextjs**: Client + server error capture
  - Source maps uploaded at build time
  - Slack webhook alerts for critical errors

### Caching Strategy
| Page Type | Strategy | Revalidation |
|-----------|----------|-------------|
| Product pages | ISR | 30-60 seconds |
| Category pages | ISR | 120 seconds |
| Cart / Checkout | Dynamic | Real-time |
| XML Feeds | ISR | 3600 seconds |
| Admin pages | Dynamic | Real-time |

### Security Headers
- CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy
- Configured in `next.config.mjs`

### Social Commerce
- **Meta Pixel**: Client-side tracking (PageView, AddToCart)
- **Meta Conversions API (CAPI)**: Server-side Purchase events
- **XML Product Feeds**: `/api/feeds/meta` and `/api/feeds/google`

## Docker & Infrastructure

### Environment Convention
All Docker files use environment suffixes — no generic names:

| Dev Environment | Prd Environment (Phase 7) |
|----------------|--------------------------|
| `Dockerfile.dev` | `Dockerfile.prd` |
| `docker-compose.dev.yml` | `docker-compose.prd.yml` |
| `.env.dev` | `.env.prd` |
| `nginx/default.dev.conf` | `nginx/default.prd.conf` |

### Container Services (Dev)
| Service | Image | Default Port |
|---------|-------|-------------|
| `app` | `Dockerfile.dev` | `3000` |
| `db` | `postgres:16-alpine` | `5432` |
| `redis` | `redis:7-alpine` | `6379` |

### Multi-Store Spawning
Multiple stores on the same server via `spawn_store.sh`:
```bash
./spawn_store.sh cabox 3000 5432 6379
./spawn_store.sh boutique 3100 5433 6380
```
Each store gets isolated: `COMPOSE_PROJECT_NAME`, Docker network, DB volume, ports.

### Database Operations
```bash
# Migrations
docker compose -f docker-compose.dev.yml exec app npx prisma migrate dev

# Seed
docker compose -f docker-compose.dev.yml exec app npx prisma db seed

# Studio
docker compose -f docker-compose.dev.yml exec app npx prisma studio

# Backup
docker compose -f docker-compose.dev.yml exec db pg_dump -U cabox cabox_db > backup.sql
```

### Running Tests
```bash
# Unit tests
docker compose -f docker-compose.dev.yml exec app npm run test

# E2E tests
docker compose -f docker-compose.dev.yml exec app npm run test:e2e
```

## Project File Structure (Key Paths)
```
cabox/
├── .ai/context/           # AI context files (this file lives here)
├── .ai/plans/             # Implementation plans
├── Dockerfile.dev         # Dev container
├── docker-compose.dev.yml # Dev stack
├── .env.dev               # Dev environment variables
├── spawn_store.sh         # Multi-store spawner
├── templates/env.dev.template
├── nginx/default.dev.conf
├── next.config.mjs        # output: 'standalone'
├── prisma/schema.prisma   # 18 data models
├── src/app/[locale]/      # i18n root (public store)
├── src/app/[locale]/admin/ # Admin dashboard (EN-only)
├── src/app/api/           # API routes
├── src/components/        # Shared UI components
├── src/lib/               # Business logic, utils
├── src/stores/            # Zustand stores
└── src/messages/          # i18n translation files (en.json, es.json)
```

## Environment Variables (Categories)
All defined in `.env.dev` (see plan §6 for full template):
- **Database**: `DATABASE_URL`
- **Auth**: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_EMAIL`
- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- **PayPal**: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`
- **Google APIs**: Vision, CSE keys
- **Perplexity**: `PERPLEXITY_API_KEY`
- **WhatsApp**: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`
- **Supabase**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Meta/Social**: `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`
- **Sentry**: `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`
- **Email**: `SENDGRID_API_KEY`, `EMAIL_FROM`
- **Redis**: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- **App**: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_DEFAULT_LOCALE`, `NEXT_PUBLIC_CURRENCY`
