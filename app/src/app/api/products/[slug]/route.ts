import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/products/[slug]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug, status: 'ACTIVE' },
    include: {
      category: true,
      images:   { orderBy: { position: 'asc' } },
      variants: { orderBy: { sku: 'asc' } },
    },
  });

  if (!product) {
    return NextResponse.json({ message: 'Producto no encontrado.' }, { status: 404 });
  }

  // Total stock across variants (if variants exist) or base stock from inventory ledger
  const inventorySummary = await prisma.inventoryRecord.groupBy({
    by: ['productId'],
    where: { productId: product.id },
    _sum: { quantity: true },
  });
  const totalStock = inventorySummary[0]?._sum.quantity ?? 0;

  return NextResponse.json({ ...product, totalStock });
}
