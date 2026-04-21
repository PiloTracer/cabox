import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { couponPatchSchema } from '@/lib/validation/coupons';
import { requireAdmin } from '@/lib/auth-guard';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const parsed = couponPatchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;
  if (Object.keys(d).length === 0) {
    return NextResponse.json({ message: 'Sin cambios' }, { status: 400 });
  }

  if (d.code !== undefined) {
    const code = d.code.trim().toUpperCase();
    const conflict = await prisma.coupon.findFirst({
      where: { code, NOT: { id } },
    });
    if (conflict) return NextResponse.json({ message: 'Código ya existe' }, { status: 409 });
  }

  const updated = await prisma.coupon.update({
    where: { id },
    data: {
      ...(d.code !== undefined && { code: d.code.trim().toUpperCase() }),
      ...(d.descriptionEs !== undefined && { descriptionEs: d.descriptionEs || null }),
      ...(d.descriptionEn !== undefined && { descriptionEn: d.descriptionEn || null }),
      ...(d.type !== undefined && { type: d.type }),
      ...(d.discountValue !== undefined && { discountValue: d.discountValue }),
      ...(d.minOrderAmount !== undefined && { minOrderAmount: d.minOrderAmount ?? null }),
      ...(d.maxDiscount !== undefined && { maxDiscount: d.maxDiscount ?? null }),
      ...(d.maxUses !== undefined && { maxUses: d.maxUses ?? null }),
      ...(d.maxUsesPerCustomer !== undefined && {
        maxUsesPerCustomer: d.maxUsesPerCustomer ?? 1,
      }),
      ...(d.startsAt !== undefined && { startsAt: new Date(d.startsAt) }),
      ...(d.expiresAt !== undefined && { expiresAt: new Date(d.expiresAt) }),
      ...(d.isActive !== undefined && { isActive: d.isActive }),
    },
  });

  return NextResponse.json(updated);
}
