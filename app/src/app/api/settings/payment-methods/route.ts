import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface MethodConfig {
  enabled: boolean;
  phone?: string;
  accountName?: string;
  bankName?: string;
  iban?: string;
}

// Public endpoint: returns enabled payment methods WITH their display config
// Used by CheckoutForm to: 1) show only active methods, 2) display real instructions
export async function GET() {
  const settings = await prisma.storeSettings.findUnique({
    where: { key: 'default' },
    select: { paymentMethods: true },
  });

  const rawMethods = (settings?.paymentMethods as unknown as Record<string, MethodConfig>) ?? {};

  // Build the response: only include enabled methods, with safe config per method
  const methods: Record<string, object> = {};

  for (const [key, cfg] of Object.entries(rawMethods)) {
    if (!cfg.enabled) continue;

    switch (key) {
      case 'SINPE':
        methods[key] = {
          enabled: true,
          phone: cfg.phone ?? '',
          accountName: cfg.accountName ?? '',
        };
        break;
      case 'TRANSFER':
        methods[key] = {
          enabled: true,
          bankName: cfg.bankName ?? '',
          iban: cfg.iban ?? '',
          accountName: cfg.accountName ?? '',
        };
        break;
      default:
        // CASH, STRIPE, PAYPAL — just the enabled flag
        methods[key] = { enabled: true };
    }
  }

  return NextResponse.json(
    { methods },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
