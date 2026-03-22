# Cabox PWA Store Context

> **Last Updated**: 2026-03-21

## Core Identity
- **Project**: Cabox — Curated Fashion
- **Type**: Progressive Web App (PWA)
- **Language**: Bilingual (English & Spanish, default: ES)
- **Domain**: Fashion / Clothing / Accessories eCommerce
- **Logo**: `tmp/cabox.jpeg`

## Optimal Tech Stack
- **Framework**: Next.js 15+ (App Router, React Server Components)
- **UI**: shadcn/ui (50 components) + Tailwind CSS v4 + Radix UI primitives
- **i18n**: `next-intl` (URL-prefix routing: `/en/…`, `/es/…`)
- **Database**: PostgreSQL via Supabase + Prisma ORM
- **Auth**: NextAuth.js v5 (admin-only, JWT, credentials provider)
- **Storage**: Supabase Storage (product images, invoices, reference uploads)
- **Payments**: Stripe (cards), PayPal SDK, manual (SINPE, Bank Transfer, Cash)
- **AI**: Google Cloud Vision + Perplexity API (sonar-pro) + Google Custom Search Images
- **WhatsApp**: Cloud API (outbound notifications) + `wa.me` links (inbound)
- **Deploy**: Docker (multi-stage Dockerfile + docker-compose) + PostgreSQL + Redis + Nginx
- **State**: Zustand (cart), React Hook Form + Zod (forms)
- **Charts**: Recharts via shadcn/ui `chart` component
- **PDF**: `@react-pdf/renderer` for invoice generation

## Brand Palette (from Logo)
| Token | Value |
|-------|-------|
| Primary | `#8B5E3C` (warm brown) |
| Accent | `#C75B7A` (pink/rose) |
| Background | `#FAF3EB` (cream) |
| Text | `#3A2A1A` (dark brown) |
| Display Font | `Playfair Display` |
| Body Font | `Inter` |

## Key Functionalities
- **AI Product Intelligence**: Image upload → Vision API → Perplexity → specs/pricing/promo images
- **Public Storefront**: Catalog, product detail, cart, checkout, order tracking, WhatsApp CTA
- **Admin Dashboard**: CRUD products, orders, inventory, customers, invoices, reports, AI research panel, shipping zones
- **Payments**: Credit Card (Stripe), PayPal, SINPE, Bank Transfer, Cash
- **Shipping**: Auto-calculated by provincial zone, weight/volumetric, free-above threshold
- **Invoicing**: PDF generation, email/WhatsApp delivery
- **Reports**: Sales, top products, inventory value, payment methods, shipping, customers

## Development Status
- **Current Phase**: Architecture & Strategic Planning
- **Active Plan**: `.ai/plans/20260321_pwa_ecommerce_plan.md`
- **Next Step**: Await plan approval → Phase 1 Docker scaffolding
