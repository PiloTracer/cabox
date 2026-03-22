import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const promoSchema = z.object({
  nameEs: z.string().min(1),
  nameEn: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y', 'FREE_SHIPPING']),
  discountValue: z.number().nonnegative(),
  minOrderAmount: z.number().optional().nullable(),
  maxDiscount: z.number().optional().nullable(),
  applicableTo: z.enum(['ALL', 'CATEGORY', 'PRODUCT']).default('ALL'),
  categoryIds: z.array(z.string()).default([]),
  productIds: z.array(z.string()).default([]),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  isActive: z.boolean().default(true),
  priority: z.number().int().default(0),
  stackable: z.boolean().default(false),
  bannerImageUrl: z.string().url().optional().nullable(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const promotions = await prisma.promotion.findMany({ orderBy: { startsAt: 'desc' } });
  return NextResponse.json(promotions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const parsed = promoSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.promotion.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return NextResponse.json({ message: 'Slug already exists' }, { status: 409 });

  const promo = await prisma.promotion.create({
    data: {
      ...parsed.data,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: new Date(parsed.data.endsAt),
      minOrderAmount: parsed.data.minOrderAmount ?? null,
      maxDiscount: parsed.data.maxDiscount ?? null,
      bannerImageUrl: parsed.data.bannerImageUrl ?? null,
    },
  });
  return NextResponse.json(promo, { status: 201 });
}
