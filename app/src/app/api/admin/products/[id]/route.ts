import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guard';

const patchSchema = z.object({
  nameEs: z.string().min(1).optional(),
  nameEn: z.string().optional(),
  descriptionEs: z.string().optional(),
  descriptionEn: z.string().optional(),
  sku: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  comparePrice: z.number().positive().nullable().optional(),
  currency: z.enum(['CRC', 'USD']).optional(),
  categoryId: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  featured: z.boolean().optional(),
  stock: z.number().int().min(0).optional(),
  images: z.array(z.string().url()).optional(),
  promotionalCopy: z.any().optional().nullable(),
  promotionalMedia: z.any().optional().nullable(),
});

interface Params { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = params;
  const product = await prisma.product.findUnique({ where: { id }, include: { category: true } });
  if (!product) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    console.error('[PUT /api/admin/products] Zod errors:', JSON.stringify(parsed.error.flatten(), null, 2));
    return NextResponse.json({ message: 'Datos inválidos', errors: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // Check slug uniqueness (exclude self)
  if (data.slug) {
    const conflict = await prisma.product.findFirst({ where: { slug: data.slug, id: { not: id } } });
    if (conflict) return NextResponse.json({ message: 'El slug ya existe.' }, { status: 409 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(data.nameEs !== undefined && { nameEs: data.nameEs }),
      ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
      ...(data.descriptionEs !== undefined && { descriptionEs: data.descriptionEs }),
      ...(data.descriptionEn !== undefined && { descriptionEn: data.descriptionEn }),
      ...(data.sku !== undefined && { sku: data.sku }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.comparePrice !== undefined && { compareAtPrice: data.comparePrice }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.categoryId !== undefined && (
        data.categoryId
          ? { category: { connect: { id: data.categoryId } } }
          : { category: { disconnect: true } }
      )),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.featured !== undefined && { featured: data.featured }),
      ...(data.stock !== undefined && { stock: data.stock }),
      ...(data.promotionalCopy !== undefined && { promotionalCopy: data.promotionalCopy }),
      ...(data.promotionalMedia !== undefined && { promotionalMedia: data.promotionalMedia }),
      ...(data.images !== undefined && { 
        images: {
          deleteMany: {},
          create: data.images.map((url: string, i: number) => ({ url, position: i }))
        }
      }),
    },
  });

  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  // Soft delete — archive instead of hard delete
  const product = await prisma.product.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  });

  return NextResponse.json(product);
}
