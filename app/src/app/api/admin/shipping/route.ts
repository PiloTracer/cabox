import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { shippingZoneSchema } from '@/lib/validation/shipping-zone';
import { requireAdmin } from '@/lib/auth-guard';

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const zones = await prisma.shippingZone.findMany({ orderBy: { nameEs: 'asc' } });
  return NextResponse.json(zones);
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = shippingZoneSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const zone = await prisma.shippingZone.create({ data: { ...parsed.data, freeAbove: parsed.data.freeAbove ?? null } });
  return NextResponse.json(zone, { status: 201 });
}
