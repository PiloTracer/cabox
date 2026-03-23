import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guard';

const adjustSchema = z.object({
  productId: z.string(),
  quantity: z.number().int(),
  type: z.enum(['RESTOCK', 'ADJUSTMENT', 'RETURN']),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  // Aggregate current stock per product using InventoryRecord ledger
  const records = await prisma.inventoryRecord.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
  });

  const productIds = records.map((r) => r.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: { not: 'ARCHIVED' } },
    select: { id: true, nameEs: true, sku: true, status: true, images: { take: 1, orderBy: { position: 'asc' } } },
  });

  const stockMap = Object.fromEntries(records.map((r) => [r.productId, r._sum.quantity ?? 0]));

  const inventory = products.map((p) => ({
    ...p,
    stock: stockMap[p.id] ?? 0,
  })).sort((a, b) => a.stock - b.stock); // lowest stock first

  return NextResponse.json(inventory);
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const parsed = adjustSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const record = await prisma.inventoryRecord.create({
    data: {
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
      type: parsed.data.type,
      note: parsed.data.note ?? null,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
