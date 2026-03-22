import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';

// POST /api/payments/stripe/checkout
// Creates a Stripe Checkout Session and returns the URL for redirect.
export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  if (!stripe) {
    return NextResponse.json({ message: 'Stripe no está configurado.' }, { status: 503 });
  }

  const { orderId } = await req.json() as { orderId: string };
  if (!orderId) return NextResponse.json({ message: 'orderId es requerido.' }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, customer: true },
  });

  if (!order) return NextResponse.json({ message: 'Pedido no encontrado.' }, { status: 404 });

  const session = await stripe.checkout.sessions.create({
    mode:              'payment',
    payment_method_types: ['card'],
    customer_email:   order.customer.email ?? undefined,
    line_items:       order.items.map((item) => ({
      quantity:     item.quantity,
      price_data: {
        currency:     order.currency.toLowerCase(),
        unit_amount:  Math.round(Number(item.price) * 100),
        product_data: { name: item.nameEs },
      },
    })),
    success_url: `${process.env.NEXTAUTH_URL}/order-confirmation?order=${order.orderNumber}`,
    cancel_url:  `${process.env.NEXTAUTH_URL}/${order.locale}/checkout`,
    metadata:    { orderId: order.id, orderNumber: order.orderNumber },
  });

  return NextResponse.json({ url: session.url });
}
