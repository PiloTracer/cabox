import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';
import { normalizePaymentMethodsJson } from '@/lib/payment-methods-settings';

const SETTINGS_KEY = 'default';

function defaultPaymentMethods(): Prisma.InputJsonValue {
  return normalizePaymentMethodsJson({
    SINPE: { enabled: true, phone: '', accountName: '' },
    TRANSFER: { enabled: false, bankName: '', iban: '', accountName: '' },
    CASH: { enabled: true },
    STRIPE: { enabled: false },
    PAYPAL: { enabled: false },
  }) as Prisma.InputJsonValue;
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const raw = await prisma.storeSettings.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, paymentMethods: defaultPaymentMethods() },
    update: {},
  });

  return NextResponse.json({
    ...raw,
    paymentMethods: normalizePaymentMethodsJson(raw.paymentMethods),
  });
}

export async function PUT(req: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = await req.json();

  const {
    storeName, storeTagline, supportPhone, paymentMethods: pmRaw,
    logoUrl, heroImageUrl, footerText, themeColor,
  } = body;

  const paymentMethods: Prisma.InputJsonValue | undefined =
    pmRaw !== undefined ? (normalizePaymentMethodsJson(pmRaw) as Prisma.InputJsonValue) : undefined;

  // Validate hex color if provided
  const validColor = (c: string) => /^#[0-9a-fA-F]{6}$/.test(c);

  const settings = await prisma.storeSettings.upsert({
    where: { key: SETTINGS_KEY },
    create: {
      key: SETTINGS_KEY,
      storeName:     storeName     ?? 'Cabox',
      storeTagline:  storeTagline  ?? 'Bien elegido · Costa Rica',
      supportPhone:  supportPhone  ?? '',
      paymentMethods: normalizePaymentMethodsJson(
        paymentMethods ?? defaultPaymentMethods(),
      ) as Prisma.InputJsonValue,
      logoUrl:       logoUrl        ?? '/logo.png',
      heroImageUrl:  heroImageUrl   ?? '',
      footerText:    footerText     ?? 'Bien elegido con amor · Costa Rica',
      themeColor:    (themeColor && validColor(themeColor)) ? themeColor : '#8B5E3C',
    },
    update: {
      ...(storeName     !== undefined && { storeName }),
      ...(storeTagline  !== undefined && { storeTagline }),
      ...(supportPhone  !== undefined && { supportPhone }),
      ...(paymentMethods !== undefined && { paymentMethods }),
      ...(logoUrl        !== undefined && { logoUrl }),
      ...(heroImageUrl   !== undefined && { heroImageUrl }),
      ...(footerText     !== undefined && { footerText }),
      ...(themeColor     !== undefined && validColor(themeColor) && { themeColor }),
    },
  });

  return NextResponse.json({
    ...settings,
    paymentMethods: normalizePaymentMethodsJson(settings.paymentMethods),
  });
}
