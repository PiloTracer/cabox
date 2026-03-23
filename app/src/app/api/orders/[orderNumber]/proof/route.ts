import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MAX_PROOFS = 2;

interface Props { params: Promise<{ orderNumber: string }> }

// GET — return existing proof URLs for an order (no auth — public, identified by orderNumber)
export async function GET(_req: Request, { params }: Props) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: { paymentProofUrls: true, paymentMethod: true, paymentStatus: true },
  });
  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
  return NextResponse.json({
    proofUrls: order.paymentProofUrls as string[],
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
    select: { id: true, paymentProofUrls: true },
  });
  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });

  const existing = (order.paymentProofUrls as string[]) ?? [];
  if (existing.length >= MAX_PROOFS) {
    return NextResponse.json(
      { error: `Máximo ${MAX_PROOFS} comprobantes permitidos por pedido` },
      { status: 409 }
    );
  }

  const updated = [...existing, url];
  await prisma.order.update({
    where: { orderNumber },
    data: { paymentProofUrls: updated },
  });

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
    select: { id: true, paymentProofUrls: true },
  });
  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });

  const existing = (order.paymentProofUrls as string[]) ?? [];
  const updated = existing.filter((u) => u !== body.url);

  await prisma.order.update({
    where: { orderNumber },
    data: { paymentProofUrls: updated },
  });

  return NextResponse.json({ proofUrls: updated });
}
