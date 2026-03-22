import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppText, buildOrderConfirmationMessage } from '@/lib/whatsapp';

// POST /api/payments/stripe/webhook
// Receives Stripe events and updates order status accordingly.
export async function POST(req: NextRequest) {
  if (!stripe) return NextResponse.json({ message: 'Stripe not configured.' }, { status: 503 });

  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ message: 'Missing signature.' }, { status: 400 });
  }

  const rawBody = await req.text();
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err);
    return NextResponse.json({ message: 'Invalid signature.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      // Update order: mark payment completed, store Stripe session ID
      const order = await prisma.order.update({
        where:   { id: orderId },
        data:    { paymentStatus: 'COMPLETED', paymentRef: session.id, status: 'CONFIRMED' },
        include: { customer: true },
      });

      // Fire WhatsApp notification (non-blocking)
      if (order.customer.phone) {
        const msg = buildOrderConfirmationMessage({
          customerName:  order.customer.name,
          orderNumber:   order.orderNumber,
          total:         Number(order.total),
          paymentMethod: order.paymentMethod,
        });
        sendWhatsAppText(order.customer.phone, msg).catch(console.error);
      }
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data:  { paymentStatus: 'FAILED' },
      });
    }
  }

  return NextResponse.json({ received: true });
}
