# Cabox — Curated Fashion PWA Store

> **Last Updated**: 2026-03-21
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

## Development Status
- **Current Phase**: Phase 4 — Storefront Professional Enhancements (complete)
- **Active Plan**: `.ai/plans/20260322_storefront_enhancements.md`
- **Implementation Plan**: `.ai/plans/20260321_pwa_ecommerce_plan.md`
- **Next Step**: Phase 5 — Stripe integration, category management, WhatsApp notifications, PWA
