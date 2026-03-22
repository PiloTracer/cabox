import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/cart/validate
 *
 * Body: { items: [{ productId, variantSku?, quantity, price }] }
 *
 * Re-validates that prices and stock are still correct before checkout.
 * Returns per-item validation results and an updated list with corrected prices.
 */
export async function POST(req: NextRequest) {
  const { items } = await req.json() as {
    items: { productId: string; variantSku?: string | null; quantity: number; price: number }[];
  };

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ valid: true, items: [] });
  }

  const results = await Promise.all(
    items.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId, status: 'ACTIVE' },
        include: {
          variants: item.variantSku ? { where: { sku: item.variantSku } } : undefined,
        },
      });

      if (!product) {
        return { ...item, valid: false, error: 'Producto ya no está disponible.' };
      }

      // Resolve the correct current price
      const variant    = product.variants?.[0];
      const currentPrice = Number(variant?.price ?? product.price);

      // Check stock via inventory ledger (or variant stock)
      let inStock = true;
      if (variant) {
        inStock = variant.stock >= item.quantity;
      } else {
        const inv = await prisma.inventoryRecord.groupBy({
          by: ['productId'],
          where: { productId: item.productId },
          _sum: { quantity: true },
        });
        inStock = (inv[0]?._sum.quantity ?? 0) >= item.quantity;
      }

      const priceChanged = Math.abs(currentPrice - item.price) > 0.01;

      return {
        ...item,
        currentPrice,
        priceChanged,
        inStock,
        valid: inStock && !priceChanged,
        error: !inStock
          ? 'Stock insuficiente para este producto.'
          : priceChanged
          ? `El precio cambió a ${currentPrice}.`
          : null,
      };
    })
  );

  const allValid = results.every((r) => r.valid);
  return NextResponse.json({ valid: allValid, items: results });
}
