import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guard';

const zoneSchema = z.object({
  nameEs: z.string().min(1),
  nameEn: z.string().min(1),
  provinces: z.array(z.string()).min(1),
  baseRate: z.number().nonnegative(),
  perKgRate: z.number().nonnegative(),
  freeAbove: z.number().nonnegative().optional().nullable(),
});

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const zones = await prisma.shippingZone.findMany({ orderBy: { nameEs: 'asc' } });
  return NextResponse.json(zones);
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = zoneSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const zone = await prisma.shippingZone.create({ data: { ...parsed.data, freeAbove: parsed.data.freeAbove ?? null } });
  return NextResponse.json(zone, { status: 201 });
}
