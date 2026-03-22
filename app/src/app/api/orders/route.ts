import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const orderSchema = z.object({
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  shippingAddress: z.record(z.string()),
  paymentMethod: z.enum(['STRIPE', 'PAYPAL', 'SINPE', 'TRANSFER', 'CASH']),
  currency: z.string().default('CRC'),
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().nullable().optional(),
    sku: z.string(),
    nameEs: z.string(),
    nameEn: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    totalPrice: z.number().positive(),
  })),
  subtotal: z.number(),
  shipping: z.number().default(0),
  tax: z.number().default(0),
  discount: z.number().default(0),
  total: z.number(),
});

// Generate a human-readable order number
function generateOrderNumber(): string {
  const prefix = 'CBX';
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}${yy}${mm}-${rand}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = orderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Datos del pedido inválidos.', errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Ensure order number is unique
  let orderNumber = generateOrderNumber();
  let attempts = 0;
  while (attempts < 5) {
    const exists = await prisma.order.findUnique({ where: { orderNumber } });
    if (!exists) break;
    orderNumber = generateOrderNumber();
    attempts++;
  }

  const order = await prisma.order.create({
    data: {
      orderNumber,
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      paymentMethod: data.paymentMethod,
      currency: data.currency,
      subtotal: data.subtotal,
      shipping: data.shipping,
      tax: data.tax,
      discount: data.discount,
      total: data.total,
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      customerPhone: data.customerPhone ?? null,
      shippingAddress: data.shippingAddress,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId ?? null,
          sku: item.sku,
          nameEs: item.nameEs,
          nameEn: item.nameEn,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(order, { status: 201 });
}
