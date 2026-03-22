import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/products?page=1&category=&search=&featured=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page      = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const PAGE_SIZE = 24;
  const category  = searchParams.get('category') ?? undefined;
  const search    = searchParams.get('search')   ?? undefined;
  const featured  = searchParams.get('featured') === 'true' ? true : undefined;

  const where = {
    status: 'ACTIVE' as const,
    ...(featured !== undefined && { featured }),
    ...(category  && { category: { slug: category } }),
    ...(search    && {
      OR: [
        { nameEs: { contains: search, mode: 'insensitive' as const } },
        { nameEn: { contains: search, mode: 'insensitive' as const } },
        { sku:    { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { slug: true, nameEs: true, nameEn: true } },
        images:   { orderBy: { position: 'asc' }, take: 2 },
        variants: { select: { id: true, nameEs: true, sku: true, price: true, stock: true } },
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    products,
    total,
    page,
    pages: Math.ceil(total / PAGE_SIZE),
  });
}
