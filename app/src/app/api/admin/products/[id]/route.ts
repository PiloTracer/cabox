import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  nameEs: z.string().min(1).optional(),
  nameEn: z.string().optional(),
  descriptionEs: z.string().nullable().optional(),
  descriptionEn: z.string().nullable().optional(),
  sku: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  comparePrice: z.number().positive().nullable().optional(),
  currency: z.enum(['CRC', 'USD']).optional(),
  categoryId: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  featured: z.boolean().optional(),
  images: z.array(z.string()).optional(),
});

interface Params { params: Promise<{ id: string }> }

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session ?? null;
}

export async function GET(_req: NextRequest, { params }: Params) {
  if (!await requireAdmin()) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: { category: true } });
  if (!product) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!await requireAdmin()) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: 'Datos inválidos', errors: parsed.error.flatten() }, { status: 400 });

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
      ...(data.comparePrice !== undefined && { comparePrice: data.comparePrice }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.featured !== undefined && { featured: data.featured }),
      ...(data.images !== undefined && { images: data.images }),
    },
  });

  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!await requireAdmin()) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Soft delete — archive instead of hard delete
  const product = await prisma.product.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  });

  return NextResponse.json(product);
}
