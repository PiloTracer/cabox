import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppText } from '@/lib/whatsapp';
import { requireAdmin } from '@/lib/auth-guard';

// POST /api/whatsapp/send
// Sends an arbitrary WhatsApp message to a phone number.
// Only accessible to admin session.
export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { to, message } = await req.json() as { to?: string; message?: string };

  if (!to || !message) {
    return NextResponse.json({ message: 'to y message son requeridos.' }, { status: 400 });
  }

  const result = await sendWhatsAppText(to, message);
  if (!result.success) {
    return NextResponse.json({ message: result.error }, { status: 502 });
  }

  return NextResponse.json({ messageId: result.messageId });
}
