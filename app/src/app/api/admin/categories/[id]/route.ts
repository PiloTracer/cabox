import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guard';

const patchSchema = z.object({
  nameEn: z.string().min(1).optional(),
  nameEs: z.string().min(1).optional(),
  image: z.string().url().optional().or(z.literal('')),
  parentId: z.string().nullable().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(parsed.data.nameEn && { nameEn: parsed.data.nameEn }),
      ...(parsed.data.nameEs && { nameEs: parsed.data.nameEs }),
      ...(parsed.data.image !== undefined && { image: parsed.data.image || null }),
      ...(parsed.data.parentId !== undefined && { parentId: parsed.data.parentId }),
    },
  });

  return NextResponse.json(category);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Prevent deletion if products or children exist
  const [productCount, childCount] = await Promise.all([
    prisma.product.count({ where: { categoryId: id } }),
    prisma.category.count({ where: { parentId: id } }),
  ]);

  if (productCount > 0) return NextResponse.json({ message: `Cannot delete: ${productCount} products use this category` }, { status: 409 });
  if (childCount > 0) return NextResponse.json({ message: `Cannot delete: has ${childCount} subcategories` }, { status: 409 });

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
