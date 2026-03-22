import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const couponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  descriptionEs: z.string().optional(),
  descriptionEn: z.string().optional(),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']),
  discountValue: z.number().nonnegative(),
  minOrderAmount: z.number().nonnegative().optional().nullable(),
  maxDiscount: z.number().nonnegative().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  maxUsesPerCustomer: z.number().int().positive().optional().nullable(),
  startsAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(coupons);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const parsed = couponSchema.safeParse(await req.json());
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
