import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendWhatsAppText, buildOrderConfirmationMessage } from '@/lib/whatsapp';

const orderSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().min(1),
  shippingAddress: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    province: z.string(),
    postalCode: z.string().optional(),
    country: z.string().default('CR'),
  }).optional().nullable(),
  paymentMethod: z.enum(['CASH', 'SINPE', 'BANK_TRANSFER', 'CREDIT_CARD', 'PAYPAL']),
  currency: z.enum(['CRC', 'USD']).default('CRC'),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    variantSku: z.string().nullable().optional(),
    nameEs: z.string().optional().default(''),
    nameEn: z.string().optional().default(''),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
  })),
  subtotal: z.number(),
  discountAmount: z.number().default(0),
  shippingCost: z.number().default(0),
  tax: z.number().default(0),
  total: z.number(),
});

function generateOrderNumber(): string {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `CBX${yy}${mm}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
  const body = await req.json();
  const parsed = orderSchema.safeParse(body);

  if (!parsed.success) {
    console.error('[orders] Zod validation errors:', JSON.stringify(parsed.error.flatten(), null, 2));
    console.error('[orders] Received body:', JSON.stringify(body, null, 2));
    return NextResponse.json(
      { message: 'Datos del pedido inválidos.', errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Upsert customer by phone
  const customer = await prisma.customer.upsert({
    where: { phone: data.customerPhone },
    update: {
      name: data.customerName,
      email: data.customerEmail ?? undefined,
    },
    create: {
      name: data.customerName,
      email: data.customerEmail ?? null,
      phone: data.customerPhone,
    },
  });

  // Ensure unique order number
  let orderNumber = generateOrderNumber();
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.order.findUnique({ where: { orderNumber } });
    if (!exists) break;
    orderNumber = generateOrderNumber();
  }

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: customer.id,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      paymentMethod: data.paymentMethod,
      currency: data.currency,
      subtotal: data.subtotal,
      discountAmount: data.discountAmount,
      couponCode: data.couponCode ?? null,
      shippingCost: data.shippingCost,
      tax: data.tax,
      total: data.total,
      shippingAddress: data.shippingAddress ?? {},
      notes: data.notes ?? null,
      locale: 'es',
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          variantSku: item.variantSku ?? null,
          nameEs: item.nameEs,
          nameEn: item.nameEn,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    },
    include: { items: true, customer: true },
  });

  // Fire WhatsApp confirmation (non-blocking — never delay the HTTP response)
  if (customer.phone) {
    const msg = buildOrderConfirmationMessage({
      customerName:  customer.name,
      orderNumber:   order.orderNumber,
      total:         Number(order.total),
      paymentMethod: order.paymentMethod,
    });
    sendWhatsAppText(customer.phone, msg).catch(console.error);
  }

  return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error('[orders] Unexpected error:', err);
    return NextResponse.json({ message: 'Error al procesar el pedido.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? undefined;
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const PAGE_SIZE = 20;

  const where = status ? { status: status as import('@prisma/client').OrderStatus } : {};
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { customer: true, items: { take: 1 } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ orders, total, page, pages: Math.ceil(total / PAGE_SIZE) });
}
