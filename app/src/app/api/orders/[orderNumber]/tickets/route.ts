import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MAX_ATTACHMENTS = 2;

interface Props { params: Promise<{ orderNumber: string }> }

/** GET — list tickets for an order (identified by orderNumber) */
export async function GET(_req: Request, { params }: Props) {
  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      paymentMethod: true,
      paymentStatus: true,
      tickets: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true, type: true, status: true,
          attachments: true, message: true, createdAt: true,
        },
      },
    },
  });

  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });

  return NextResponse.json({
    tickets: order.tickets,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
  });
}

/** POST — create (or update) a PAYMENT_PROOF ticket with up to 2 attachment URLs */
export async function POST(req: Request, { params }: Props) {
  const { orderNumber } = await params;

  let body: { attachments: string[]; message?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }); }

  const { attachments = [], message } = body;

  // Validate each URL is our own upload path
  const invalid = attachments.filter((u) => !u.startsWith('/uploads/proofs/'));
  if (invalid.length) return NextResponse.json({ error: 'URL no permitida' }, { status: 400 });

  if (attachments.length > MAX_ATTACHMENTS) {
    return NextResponse.json(
      { error: `Máximo ${MAX_ATTACHMENTS} comprobantes por envío` },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: { id: true },
  });
  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });

  // Check if a PAYMENT_PROOF ticket already exists — update it instead of creating another
  const existing = await prisma.orderTicket.findFirst({
    where: { orderId: order.id, type: 'PAYMENT_PROOF' },
  });

  // Count existing attachments + new ones
  const existingUrls = existing ? (existing.attachments as string[]) : [];
  const merged = [...existingUrls, ...attachments];
  if (merged.length > MAX_ATTACHMENTS) {
    return NextResponse.json(
      { error: `Ya tienes ${existingUrls.length} comprobante(s). Máximo ${MAX_ATTACHMENTS} en total.` },
      { status: 409 }
    );
  }

  const ticket = existing
    ? await prisma.orderTicket.update({
        where: { id: existing.id },
        data: { attachments: merged, message: message ?? existing.message, status: 'OPEN' },
      })
    : await prisma.orderTicket.create({
        data: {
          orderId: order.id,
          orderNumber,
          type: 'PAYMENT_PROOF',
          attachments,
          message,
        },
      });

  return NextResponse.json({ ticket });
}
