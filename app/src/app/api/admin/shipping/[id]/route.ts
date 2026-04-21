import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';
import { shippingZonePatchSchema } from '@/lib/validation/shipping-zone';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const existing = await prisma.shippingZone.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const parsed = shippingZonePatchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;
  if (Object.keys(d).length === 0) {
    return NextResponse.json({ message: 'Sin cambios' }, { status: 400 });
  }

  const updated = await prisma.shippingZone.update({
    where: { id },
    data: {
      ...(d.nameEs !== undefined && { nameEs: d.nameEs }),
      ...(d.nameEn !== undefined && { nameEn: d.nameEn }),
      ...(d.provinces !== undefined && { provinces: d.provinces }),
      ...(d.baseRate !== undefined && { baseRate: d.baseRate }),
      ...(d.perKgRate !== undefined && { perKgRate: d.perKgRate }),
      ...(d.freeAbove !== undefined && { freeAbove: d.freeAbove }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const existing = await prisma.shippingZone.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  await prisma.shippingZone.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
