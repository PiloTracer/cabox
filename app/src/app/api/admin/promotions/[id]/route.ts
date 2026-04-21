import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { promotionPatchSchema } from '@/lib/validation/promotions';
import { requireAdmin } from '@/lib/auth-guard';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const existing = await prisma.promotion.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const parsed = promotionPatchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;
  if (Object.keys(d).length === 0) {
    return NextResponse.json({ message: 'Sin cambios' }, { status: 400 });
  }

  if (d.slug !== undefined) {
    const slug = d.slug.trim().toLowerCase();
    const conflict = await prisma.promotion.findFirst({
      where: { slug, NOT: { id } },
    });
    if (conflict) return NextResponse.json({ message: 'Slug ya existe' }, { status: 409 });
  }

  const data: Prisma.PromotionUpdateInput = {
    ...(d.nameEs !== undefined && { nameEs: d.nameEs }),
    ...(d.nameEn !== undefined && { nameEn: d.nameEn }),
    ...(d.slug !== undefined && { slug: d.slug.trim().toLowerCase() }),
    ...(d.type !== undefined && { type: d.type }),
    ...(d.discountValue !== undefined && { discountValue: d.discountValue }),
    ...(d.minOrderAmount !== undefined && {
      minOrderAmount: d.minOrderAmount ?? null,
    }),
    ...(d.maxDiscount !== undefined && { maxDiscount: d.maxDiscount ?? null }),
    ...(d.applicableTo !== undefined && { applicableTo: d.applicableTo }),
    ...(d.categoryIds !== undefined && { categoryIds: d.categoryIds }),
    ...(d.productIds !== undefined && { productIds: d.productIds }),
    ...(d.startsAt !== undefined && { startsAt: new Date(d.startsAt) }),
    ...(d.endsAt !== undefined && { endsAt: new Date(d.endsAt) }),
    ...(d.isActive !== undefined && { isActive: d.isActive }),
    ...(d.priority !== undefined && { priority: d.priority }),
    ...(d.stackable !== undefined && { stackable: d.stackable }),
    ...(d.bannerImageUrl !== undefined && {
      bannerImageUrl:
        d.bannerImageUrl === null || d.bannerImageUrl === ''
          ? null
          : d.bannerImageUrl,
    }),
  };

  const updated = await prisma.promotion.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}
