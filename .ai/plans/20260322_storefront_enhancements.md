# Storefront Professional Enhancements Plan (2026-03-22)

## 1. Slide-out Cart Drawer
**Goal:** Keep users on the product or listing page when adding items to the cart, improving the UX and conversion rate.
**Implementation:**
- Create a `CartDrawer.tsx` client component that listens to the `useCartStore`.
- Integrate a global state or Next.js layout context to toggle the drawer Open/Closed.
- Update `AddToCartButton.tsx` and the main Navbar Cart Icon to trigger the drawer instead of navigating to `/cart` directly.
- Ensure the drawer slide animation and backdrop overlay are smooth.

## 2. Image Zoom (Lightbox/Magnifier)
**Goal:** Allow users to examine high-resolution product details on hover or click.
**Implementation:**
- Enhance `ProductGallery.tsx`.
- Add a hover-zoom effect for desktop users (CSS transform/scale within a hidden overflow container).
- Add a full-screen swipeable modal/lightbox (using a lightweight library like `yet-another-react-lightbox` or custom implementation) for mobile users to tap and expand the image.

## 3. Skeleton Loaders
**Goal:** Implement shimmering placeholders during client-side navigation or data fetching to make the app feel faster.
**Implementation:**
- Create generic `<Skeleton />`, `<ProductCardSkeleton />`, and `<ProductDetailSkeleton />` components.
- Implement Next.js App Router `loading.tsx` files for the Storefront (`[locale]/(store)/loading.tsx` and specific routes like `/products/[slug]/loading.tsx`).
- Apply shimmering CSS animations.

## 4. JSON-LD Schema Markup
**Goal:** Provide search engines with exact product data (price, availability, images) to enable Rich Snippets in Google Search.
**Implementation:**
- Update `app/[locale]/(store)/products/[slug]/page.tsx` metadata.
- Inject a `<script type="application/ld+json">` block containing the `Product` schema.
- Data mapping: Product Name, Description, Image URLs, Price, Currency, and Availability (`InStock` vs `OutOfStock`).

## 5. Dynamic Sitemap & Robots.txt
**Goal:** Ensure all products and categories are automatically indexed by search engines.
**Implementation:**
- Create `app/sitemap.ts` in the Next.js App Router.
- Fetch all active products and categories from Prisma.
- Generate valid XML sitemap nodes for each route per locale (`es` and `en`).
- Create `app/robots.txt` or `app/robots.ts` to allow crawling and point to the dynamic sitemap URL.

## Status:
- [ ] Planned
