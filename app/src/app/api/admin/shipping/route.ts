import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const zoneSchema = z.object({
  nameEs: z.string().min(1),
  nameEn: z.string().min(1),
  provinces: z.array(z.string()).min(1),
  baseRate: z.number().nonnegative(),
  perKgRate: z.number().nonnegative(),
  freeAbove: z.number().nonnegative().optional().nullable(),
});

export async function GET() {
  const zones = await prisma.shippingZone.findMany({ orderBy: { nameEs: 'asc' } });
  return NextResponse.json(zones);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const parsed = zoneSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const zone = await prisma.shippingZone.create({ data: { ...parsed.data, freeAbove: parsed.data.freeAbove ?? null } });
  return NextResponse.json(zone, { status: 201 });
}
