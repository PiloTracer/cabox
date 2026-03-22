import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppText, buildOrderConfirmationMessage } from '@/lib/whatsapp';

/**
 * POST /api/payments/paypal/webhook
 *
 * Handles PayPal IPN / Webhook events.
 * Marks order as COMPLETED when PAYMENT.CAPTURE.COMPLETED event is received.
 *
 * PayPal sends: { event_type, resource: { invoice_id (= orderNumber), amount } }
 */
export async function POST(req: NextRequest) {
  const body  = await req.json() as {
    event_type: string;
    resource: { invoice_id?: string; id?: string };
  };

  if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const orderNumber = body.resource?.invoice_id;
    if (orderNumber) {
      const order = await prisma.order.update({
        where:   { orderNumber },
        data:    { paymentStatus: 'COMPLETED', paymentRef: body.resource.id, status: 'CONFIRMED' },
        include: { customer: true },
      });

      if (order.customer.phone) {
        const msg = buildOrderConfirmationMessage({
          customerName:  order.customer.name,
          orderNumber:   order.orderNumber,
          total:         Number(order.total),
          paymentMethod: 'PAYPAL',
        });
        sendWhatsAppText(order.customer.phone, msg).catch(console.error);
      }
    }
  }

  if (body.event_type === 'PAYMENT.CAPTURE.DENIED' || body.event_type === 'PAYMENT.CAPTURE.REFUNDED') {
    const orderNumber = body.resource?.invoice_id;
    if (orderNumber) {
      await prisma.order.updateMany({
        where: { orderNumber },
        data:  { paymentStatus: body.event_type === 'PAYMENT.CAPTURE.REFUNDED' ? 'REFUNDED' : 'FAILED' },
      });
    }
  }

  return NextResponse.json({ received: true });
}
