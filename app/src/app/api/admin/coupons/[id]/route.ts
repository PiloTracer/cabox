import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guard';

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  descriptionEs: z.string().optional(),
  descriptionEn: z.string().optional(),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.coupon.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}
