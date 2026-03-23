import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';

const SETTINGS_KEY = 'default';

function defaultPaymentMethods() {
  return {
    SINPE:    { enabled: true,  phone: '', accountName: '' },
    TRANSFER: { enabled: false, bankName: '', iban: '', accountName: '' },
    CASH:     { enabled: true },
    STRIPE:   { enabled: false },
    PAYPAL:   { enabled: false },
  };
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const settings = await prisma.storeSettings.upsert({
    where:  { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, paymentMethods: defaultPaymentMethods() },
    update: {},
  });

  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = await req.json();

  const {
    storeName, storeTagline, supportPhone, paymentMethods,
    logoUrl, heroImageUrl, footerText, themeColor,
  } = body;

  // Validate hex color if provided
  const validColor = (c: string) => /^#[0-9a-fA-F]{6}$/.test(c);

  const settings = await prisma.storeSettings.upsert({
    where: { key: SETTINGS_KEY },
    create: {
      key: SETTINGS_KEY,
      storeName:     storeName     ?? 'Cabox',
      storeTagline:  storeTagline  ?? 'Moda Curada de Costa Rica',
      supportPhone:  supportPhone  ?? '',
      paymentMethods: paymentMethods ?? defaultPaymentMethods(),
      logoUrl:       logoUrl        ?? '/logo.png',
      heroImageUrl:  heroImageUrl   ?? '',
      footerText:    footerText     ?? 'Moda curada con amor · Costa Rica',
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

  return NextResponse.json(settings);
}
