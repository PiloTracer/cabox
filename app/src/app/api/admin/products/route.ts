import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const productSchema = z.object({
  nameEs: z.string().min(1),
  nameEn: z.string().default(''),
  descriptionEs: z.string().default(''),
  descriptionEn: z.string().default(''),
  sku: z.string().min(1),
  slug: z.string().min(1),
  price: z.number().positive(),
  comparePrice: z.number().positive().nullable().default(null),
  currency: z.enum(['CRC', 'USD']).default('CRC'),
  categoryId: z.string().nullable().default(null),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT'),
  featured: z.boolean().default(false),
  stock: z.number().int().min(0).default(0),
  // images: accept URL strings for convenience; server converts to ProductImage records
  images: z.array(z.string().url()).default([]),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return session;
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Datos inválidos', errors: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // Check slug uniqueness
  const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return NextResponse.json({ message: 'El slug ya existe. Por favor usa uno diferente.' }, { status: 409 });
  }

  // Uniqueness guard for SKU too
  const skuExists = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (skuExists) return NextResponse.json({ message: 'El SKU ya existe.' }, { status: 409 });

  const product = await prisma.product.create({
    data: {
      nameEs:        data.nameEs,
      nameEn:        data.nameEn,
      descriptionEs: data.descriptionEs ?? '',
      descriptionEn: data.descriptionEn ?? '',
      sku:           data.sku,
      slug:          data.slug,
      price:         data.price,
      compareAtPrice: data.comparePrice,
      currency:      data.currency,
      categoryId:    data.categoryId!,
      status:        data.status,
      featured:      data.featured,
      stock:         data.stock,
      images: {
        create: data.images.map((url, i) => ({ url, position: i })),
      },
    },
    include: { images: true, category: true },
  });

  return NextResponse.json(product, { status: 201 });
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const cat = searchParams.get('cat');

  const products = await prisma.product.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(cat ? { category: { slug: cat } } : {}),
    },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(products);
}
