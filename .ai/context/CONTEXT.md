# Cabox — Curated Fashion PWA Store

> **Last Updated**: 2026-04-20
> **License**: Copyright (c) 2026 Alejandro Castro. All rights reserved.

## Core Identity
- **Project**: Cabox — Curated Fashion
- **Type**: Progressive Web App (PWA), 100% Docker-centric
- **Language**: Bilingual (English & Spanish, default: ES)
- **Admin Language**: English only
- **Domain**: Fashion / Clothing / Accessories eCommerce
- **Logo**: `tmp/cabox.jpeg`
- **Repository**: `PiloTracer/cabox` on GitHub

## Two Interfaces
| Interface | Audience | Language |
|-----------|----------|----------|
| **Public Storefront** | Customers (B2C) | Bilingual (EN/ES) |
| **Admin Dashboard** | Store owner | English only |

## Tech Stack (Summary)
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15+ (App Router, RSC) |
| UI | shadcn/ui + Tailwind CSS v4 + Radix UI |
| i18n | `next-intl` (URL-prefix: `/en`, `/es`) |
| Database | PostgreSQL 16 (Docker) + Prisma ORM |
| Auth | NextAuth.js v5 (admin-only, JWT) |
| Storage | Supabase Storage |
| Payments | Stripe, PayPal, SINPE, Bank Transfer, Cash |
| AI | Google Cloud Vision + Perplexity + Google CSE |
| WhatsApp | Cloud API (outbound) + `wa.me` links (inbound) |
| Deploy | Docker (env-suffixed: `.dev`/`.prd`) + PostgreSQL + Redis + Nginx |
| State | Zustand (cart), React Hook Form + Zod |
| Email | SendGrid + React Email |
| Monitoring | Sentry (`@sentry/nextjs`) |
| Rate Limiting | `@upstash/ratelimit` via Redis |

## Brand Palette
| Token | Value |
|-------|-------|
| Primary | `#8B5E3C` (warm brown) |
| Accent | `#C75B7A` (pink/rose) |
| Background | `#FAF3EB` (cream) |
| Text | `#3A2A1A` (dark brown) |
| Display Font | `Playfair Display` |
| Body Font | `Inter` |

## Docker Architecture
- **Convention**: All Docker files have environment suffix (`.dev`, `.prd`)
- **Dev files**: `Dockerfile.dev`, `docker-compose.dev.yml`, `.env.dev`
- **Multi-store**: `spawn_store.sh` spawns isolated stacks on same server
- **Each stack**: own PostgreSQL, Redis, Docker network, ports

## Key Documents
| File | Purpose |
|------|---------|
| `.ai/plans/20260321_pwa_ecommerce_plan.md` | Complete implementation plan (35 resolved gaps) |
| `.ai/context/CONTEXT.md` | This file — primary project context |
| `.ai/context/CONTEXT_TECH.md` | Technical details, stack, structure |
| `.ai/context/HANDOFF.md` | Session resumption state |
| `.ai/context/.cursorrules` | Agent coding rules |

**Agent bootstrap order:** `HANDOFF.md` → `CONTEXT.md` → `CONTEXT_TECH.md` → plans as needed.

## Development Status
- **Current Phase**: Phase 5 — Core Integrations (in progress)
- **Completed**: Phase 4 — Storefront Professional Enhancements (cart drawer, image zoom, skeletons, SEO schema)
- **Active feature thread**: **Departments** — schema apply via **`app/prisma/schema_changes.sql`** + **`schema_population.sql`** (see `.ai/context/HANDOFF.md`).
- **Implementation Plan**: `.ai/plans/20260321_pwa_ecommerce_plan.md`
- **Departments Plan**: `.ai/plans/20260417_departments.md`
- **Recently Added**: Volume-level backup/restore in `bin/start.sh`

## Feature Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| **WhatsApp Notifications** | ✅ Implemented | `lib/whatsapp.ts`, order confirmation messages, admin send API |
| **Stripe Payments** | ✅ Implemented | Checkout session, webhook, `lib/stripe.ts` |
| **PayPal Payments** | ✅ Implemented | Webhook, SDK integration |
| **Categories API** | ✅ Implemented | CRUD endpoints at `/api/admin/categories` |
| **Categories Admin UI** | ⚠️ Partial | API ready, sidebar link exists, page needs verification |
| **PWA** | ⚠️ Partial | `@ducanh2912/next-pwa` installed, manifest exists, service worker config needed |
| **Backup/Restore** | ✅ Implemented | Volume-level backup in `bin/start.sh` (B/R menu options) |
| **Departments (catalog + routing)** | ✅ Code / ⚠️ DB | Store + APIs + `[department]` routes; DB must run `schema_changes.sql` + `schema_population.sql` (container entrypoint) |
| **WhatsApp Plan** | ❌ Empty | `.ai/plans/20260322_whatsapp_plan.md` is 0 bytes |

## Next steps

1. **Departments DB / prod** — see **`.ai/context/HANDOFF.md`** (atomic steps).  
2. PWA service worker configuration.  
3. Verify admin categories page.  
4. Populate or remove `.ai/plans/20260322_whatsapp_plan.md`.  
5. Stripe Connect / payouts (future).  
6. Inventory variants UI.
