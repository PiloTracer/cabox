import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const patchSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  paymentRef: z.string().optional(),
  notes: z.string().optional(),
}).refine((d) => d.status || d.paymentStatus || d.paymentRef !== undefined || d.notes !== undefined, {
  message: 'At least one field must be provided',
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: { product: { select: { slug: true, images: { take: 1, orderBy: { position: 'asc' } } } } },
      },
      invoices: { orderBy: { createdAt: 'desc' }, take: 3 },
    },
  });

  if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });

  return NextResponse.json(order);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid data', errors: parsed.error.flatten() }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      ...(parsed.data.status && { status: parsed.data.status }),
      ...(parsed.data.paymentStatus && { paymentStatus: parsed.data.paymentStatus }),
      ...(parsed.data.paymentRef !== undefined && { paymentRef: parsed.data.paymentRef }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
    },
    include: { customer: true, items: true },
  });

  return NextResponse.json(order);
}
