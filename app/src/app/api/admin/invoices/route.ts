import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';
import { z } from 'zod';

const invoiceSchema = z.object({
  orderId:       z.string().optional(),
  customerName:  z.string().min(1),
  customerEmail: z.string().email().optional().nullable(),
  locale:        z.enum(['es', 'en']).default('es'),
  currency:      z.enum(['CRC', 'USD']).default('CRC'),
  items: z.array(z.object({
    name:     z.string(),
    qty:      z.number().int().positive(),
    price:    z.number().positive(),
    subtotal: z.number().positive(),
  })),
  subtotal: z.number(),
  tax:      z.number().default(0),
  total:    z.number(),
});

function generateInvoiceNumber(): string {
  const d = new Date();
  const yymm = `${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}`;
  const rand  = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${yymm}-${rand}`;
}

// GET /api/admin/invoices — list
export async function GET(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { searchParams } = new URL(req.url);
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const PAGE_SIZE = 20;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * PAGE_SIZE,
      take:    PAGE_SIZE,
      include: { order: { select: { orderNumber: true } } },
    }),
    prisma.invoice.count(),
  ]);

  return NextResponse.json({ invoices, total, page, pages: Math.ceil(total / PAGE_SIZE) });
}

// POST /api/admin/invoices — create
export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const body = await req.json();
  const parsed = invoiceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  // Ensure unique invoice number
  let invoiceNumber = generateInvoiceNumber();
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.invoice.findUnique({ where: { invoiceNumber } });
    if (!exists) break;
    invoiceNumber = generateInvoiceNumber();
  }

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      orderId:       data.orderId ?? null,
      customerName:  data.customerName,
      customerEmail: data.customerEmail ?? null,
      items:         data.items,
      subtotal:      data.subtotal,
      tax:           data.tax,
      total:         data.total,
      currency:      data.currency,
      locale:        data.locale,
      status:        'DRAFT',
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
