import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guard';
import { syncProductCatalogRelations } from '@/lib/sync-product-catalog';

const productSchema = z.object({
  nameEs: z.string().min(1),
  nameEn: z.string().default(''),
  descriptionEs: z.string().default(''),
  descriptionEn: z.string().default(''),
  specsEs: z.string().default(''),
  specsEn: z.string().default(''),
  sku: z.string().min(1),
  slug: z.string().min(1),
  price: z.number().positive(),
  comparePrice: z.number().positive().nullable().default(null),
  currency: z.enum(['CRC', 'USD']).default('CRC'),
  primaryCategoryId: z.string().min(1),
  primaryDepartmentId: z.string().min(1),
  categoryIds: z.array(z.string()).optional(),
  departmentIds: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT'),
  featured: z.boolean().default(false),
  stock: z.number().int().min(0).default(0),
  images: z.array(z.string().min(1)).default([]),
  promotionalCopy: z.any().optional().nullable(),
  promotionalMedia: z.any().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Datos inválidos', errors: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return NextResponse.json({ message: 'El slug ya existe. Por favor usa uno diferente.' }, { status: 409 });
  }

  const skuExists = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (skuExists) return NextResponse.json({ message: 'El SKU ya existe.' }, { status: 409 });

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        nameEs: data.nameEs,
        nameEn: data.nameEn,
        descriptionEs: data.descriptionEs ?? '',
        descriptionEn: data.descriptionEn ?? '',
        specsEs: data.specsEs ?? '',
        specsEn: data.specsEn ?? '',
        sku: data.sku,
        slug: data.slug,
        price: data.price,
        compareAtPrice: data.comparePrice,
        currency: data.currency,
        primaryCategoryId: data.primaryCategoryId,
        primaryDepartmentId: data.primaryDepartmentId,
        status: data.status,
        featured: data.featured,
        stock: data.stock,
        promotionalCopy: data.promotionalCopy,
        promotionalMedia: data.promotionalMedia,
        images: {
          create: data.images.map((url, i) => ({ url, position: i })),
        },
      },
    });

    await syncProductCatalogRelations(tx, created.id, {
      primaryCategoryId: data.primaryCategoryId,
      primaryDepartmentId: data.primaryDepartmentId,
      categoryIds: data.categoryIds,
      departmentIds: data.departmentIds,
    });

    return tx.product.findUnique({
      where: { id: created.id },
      include: {
        primaryCategory: true,
        primaryDepartment: true,
        images: true,
      },
    });
  });

  return NextResponse.json(product, { status: 201 });
}

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const cat = searchParams.get('cat');
  const filter = searchParams.get('filter');

  let extraWhere: import('@prisma/client').Prisma.ProductWhereInput = {};

  if (filter === 'unclassified') {
    const { findUnclassifiedProductIds } = await import('@/lib/departments');
    const ids = await findUnclassifiedProductIds();
    extraWhere =
      ids.length > 0
        ? { id: { in: ids } }
        : { sku: '__FILTER_EMPTY_UNCLASSIFIED__' };
  }

  const products = await prisma.product.findMany({
    where: {
      ...(status ? { status: status as import('@prisma/client').ProductStatus } : {}),
      ...(cat ? { primaryCategory: { slug: cat } } : {}),
      ...extraWhere,
    },
    include: {
      primaryCategory: true,
      primaryDepartment: true,
      departments: { include: { department: true }, orderBy: { position: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(products);
}
