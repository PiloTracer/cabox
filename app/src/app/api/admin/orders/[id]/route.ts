import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guard';

const patchSchema = z.object({
  paymentStatus: z.enum(['PENDING', 'PAID', 'CANCELLED', 'REFUNDED']).optional(),
  orderStatus: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid data', errors: parsed.error.flatten() }, { status: 400 });
  }

  // Assuming PUT would update the order with the parsed data
  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      ...(parsed.data.paymentStatus && { paymentStatus: parsed.data.paymentStatus }),
      ...(parsed.data.orderStatus && { orderStatus: parsed.data.orderStatus }),
    },
    include: { customer: true, items: true },
  });

  return NextResponse.json(updatedOrder);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = params;
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
