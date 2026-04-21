import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { promotionCreateSchema } from '@/lib/validation/promotions';
import { requireAdmin } from '@/lib/auth-guard';

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const promotions = await prisma.promotion.findMany({ orderBy: { startsAt: 'desc' } });
  return NextResponse.json(promotions);
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = promotionCreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.promotion.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return NextResponse.json({ message: 'Slug already exists' }, { status: 409 });

  const { bannerImageUrl: rawBanner, ...fields } = parsed.data;
  const bannerImageUrl = rawBanner === '' || rawBanner == null ? null : rawBanner;

  const promo = await prisma.promotion.create({
    data: {
      ...fields,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: new Date(parsed.data.endsAt),
      minOrderAmount: parsed.data.minOrderAmount ?? null,
      maxDiscount: parsed.data.maxDiscount ?? null,
      bannerImageUrl,
    },
  });
  return NextResponse.json(promo, { status: 201 });
}
