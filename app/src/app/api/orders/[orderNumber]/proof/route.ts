import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MAX_PROOFS = 2;

interface Props { params: Promise<{ orderNumber: string }> }

// GET — return existing proof URLs for an order (no auth — public, identified by orderNumber)
export async function GET(_req: Request, { params }: Props) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { tickets: { where: { type: 'PAYMENT_PROOF' } } },
  });
  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });

  const proofTicket = order.tickets[0];
  const proofUrls = proofTicket ? (proofTicket.attachments as string[]) : [];

  return NextResponse.json({
    proofUrls,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
  });
}

// POST — attach a new proof URL to an order (already uploaded via /api/upload/payment-proof)
export async function POST(req: Request, { params }: Props) {
  const { orderNumber } = await params;

  let body: { url: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { url } = body;
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
  }
  // Sanity check — must be our own upload path
  if (!url.startsWith('/uploads/proofs/')) {
    return NextResponse.json({ error: 'URL no permitida' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { tickets: { where: { type: 'PAYMENT_PROOF' } } },
  });
  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });

  const proofTicket = order.tickets[0];
  const existing = proofTicket ? (proofTicket.attachments as string[]) : [];

  if (existing.length >= MAX_PROOFS) {
    return NextResponse.json(
      { error: `Máximo ${MAX_PROOFS} comprobantes permitidos por pedido` },
      { status: 409 }
    );
  }

  const updated = [...existing, url];

  if (proofTicket) {
    await prisma.orderTicket.update({
      where: { id: proofTicket.id },
      data: { attachments: updated },
    });
  } else {
    await prisma.orderTicket.create({
      data: {
        orderId: order.id,
        orderNumber,
        type: 'PAYMENT_PROOF',
        attachments: updated,
      },
    });
  }

  return NextResponse.json({ proofUrls: updated });
}

// DELETE — remove a proof URL by index
export async function DELETE(req: Request, { params }: Props) {
  const { orderNumber } = await params;
  let body: { url: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { tickets: { where: { type: 'PAYMENT_PROOF' } } },
  });
  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });

  const proofTicket = order.tickets[0];
  if (!proofTicket) return NextResponse.json({ proofUrls: [] });

  const existing = (proofTicket.attachments as string[]) ?? [];
  const updated = existing.filter((u) => u !== body.url);

  await prisma.orderTicket.update({
    where: { id: proofTicket.id },
    data: { attachments: updated },
  });

  return NextResponse.json({ proofUrls: updated });
}