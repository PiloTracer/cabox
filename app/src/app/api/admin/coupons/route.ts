import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { couponCreateSchema } from '@/lib/validation/coupons';
import { requireAdmin } from '@/lib/auth-guard';

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(coupons);
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = couponCreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.coupon.findUnique({ where: { code: parsed.data.code } });
  if (existing) return NextResponse.json({ message: 'Code already exists' }, { status: 409 });

  const coupon = await prisma.coupon.create({
    data: {
      ...parsed.data,
      startsAt: new Date(parsed.data.startsAt),
      expiresAt: new Date(parsed.data.expiresAt),
      minOrderAmount: parsed.data.minOrderAmount ?? null,
      maxDiscount: parsed.data.maxDiscount ?? null,
      maxUses: parsed.data.maxUses ?? null,
      maxUsesPerCustomer: parsed.data.maxUsesPerCustomer ?? 1,
    },
  });
  return NextResponse.json(coupon, { status: 201 });
}
