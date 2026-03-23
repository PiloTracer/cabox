# Feature Plan: Inventory Control for Products
**File:** `.ai/plans/20260322_inventory_control.md`  
**Author:** AI Dev Session  
**Date:** 2026-03-22  
**Status:** ⚙️ Partially Implemented — Backend API ✅ Complete | Admin UI ❌ Not Started

---

## Overview / Resumen

**EN:** Add inventory management (stock tracking) to the product addition/editing/display flows. Currently, the Prisma schema defines `InventoryRecord` and `ProductVariant.stock`, but these fields are **not exposed** in the admin UI. This plan covers making stock visible and manageable by the admin.

**ES:** Agregar control de inventario (seguimiento de stock) a los flujos de adición, edición y visualización de productos. Actualmente, el esquema Prisma define `InventoryRecord` y `ProductVariant.stock`, pero estos campos **no se exponen** en la interfaz de administrador.

---

## Current Schema

### InventoryRecord (already exists)
```prisma
model InventoryRecord {
  id        String        @id @default(cuid())
  productId String
  product   Product       @relation(...)
  quantity  Int
  type      InventoryType // RESTOCK | SALE | ADJUSTMENT | RETURN
  note      String?
  createdAt DateTime      @default(now())
}
```

### ProductVariant (already exists)
```prisma
model ProductVariant {
  stock Int @default(0)
}
```

---

## Proposed Changes

### Phase 1: Basic Stock Display & Editing
> Minimum viable inventory control in the admin UI.

#### 1.1 ProductForm.tsx - Add Stock Fields
- Add a **"Inventario"** card section to the product form
- For simple products (no variants): show a single `stock` number input
- For variant products: show stock per variant row
- Include "Status" badge: 🟢 In Stock / 🟡 Low Stock / 🔴 Out of Stock

#### 1.2 Products Listing Page - Show Stock Column
- Add a **Stock** column to the admin products table
- Show total inventory count (sum of all InventoryRecords)
- Color-coded: green (>5), yellow (1-5), red (0)

#### 1.3 API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/admin/products/:id/inventory` | GET | Get inventory history |
| `POST /api/admin/products/:id/inventory` | POST | Create inventory record (restock/adjust) |

### Phase 2: Inventory History & Audit Trail
> Detailed tracking and management.

- Inventory movement log (collapsible section on product edit page)
- Shows chronological list: date, type, quantity, note
- Auto-creates SALE type records when orders are placed
- Auto-creates RETURN type records when returns are processed

### Phase 3: Alerts
> Proactive inventory management.

- Low-stock notifications in admin dashboard
- Optional WhatsApp alert when stock drops below threshold
- "Out of stock" auto-hide on storefront

---

## UI Wireframe (Inventario Card)

```
┌─────────────────────────────────────────────────┐
│ 📦 Inventario                                    │
├─────────────────────────────────────────────────┤
│  Stock actual:  [ 15 ]     🟢 En stock          │
│  Umbral bajo:   [ 3  ]                          │
│                                                  │
│  ┌─ Historial de movimientos ────────────────┐  │
│  │ 22/03  RESTOCK   +20  "Lote inicial"     │  │
│  │ 22/03  SALE       -3  "Pedido #001"      │  │
│  │ 22/03  ADJUSTMENT -2  "Defectuosos"      │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  [ + Agregar movimiento ] (RESTOCK/ADJUSTMENT)  │
└─────────────────────────────────────────────────┘
```

---

## Dependencies

- No new npm packages needed
- No schema changes needed (InventoryRecord model already exists)
- Only UI and API route work required

---

## Files to Create / Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/admin/ProductForm.tsx` | MODIFY | Add Inventario card section |
| `src/app/admin/(protected)/products/page.tsx` | MODIFY | Add stock column to listing table |
| `src/app/api/admin/products/[id]/inventory/route.ts` | NEW | Inventory CRUD endpoint |
| `src/components/admin/InventoryHistory.tsx` | NEW | Collapsible inventory log component |
