/**
 * lib/whatsapp.ts
 *
 * Centralized WhatsApp Business Cloud API wrapper.
 * Single source of truth — never duplicate this logic in routes.
 */

const WA_API_URL = 'https://graph.facebook.com/v20.0';
const PHONE_ID   = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const TOKEN      = process.env.WHATSAPP_ACCESS_TOKEN!;

export interface WASendResult {
  success:   boolean;
  messageId: string | null;
  error:     string | null;
}

/** Send a plain text message to a recipient phone number (international format, no +). */
export async function sendWhatsAppText(to: string, text: string): Promise<WASendResult> {
  if (!PHONE_ID || !TOKEN) {
    console.warn('[WhatsApp] Env vars not configured — skipping send.');
    return { success: false, messageId: null, error: 'WhatsApp not configured.' };
  }

  try {
    const res = await fetch(`${WA_API_URL}/${PHONE_ID}/messages`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to:                to.replace(/\D/g, ''), // strip non-digits
        type:              'text',
        text:              { body: text },
      }),
    });

    const data = await res.json() as { messages?: { id: string }[]; error?: { message: string } };

    if (!res.ok || data.error) {
      return { success: false, messageId: null, error: data.error?.message ?? 'Unknown error' };
    }

    return { success: true, messageId: data.messages?.[0]?.id ?? null, error: null };
  } catch (err) {
    return { success: false, messageId: null, error: String(err) };
  }
}

/** Build a "new order" message for a customer (Spanish, bilingual CRC). */
export function buildOrderConfirmationMessage(opts: {
  customerName:  string;
  orderNumber:   string;
  total:         number;
  paymentMethod: string;
}): string {
  const { customerName, orderNumber, total, paymentMethod } = opts;
  const fmtTotal = new Intl.NumberFormat('es-CR', {
    style: 'currency', currency: 'CRC', maximumFractionDigits: 0,
  }).format(total);

  return (
    `¡Hola ${customerName}! 👋\n\n` +
    `Tu pedido *${orderNumber}* ha sido recibido exitosamente. ✅\n\n` +
    `💰 Total: *${fmtTotal}*\n` +
    `💳 Método de pago: *${paymentMethod}*\n\n` +
    `Te contactaremos pronto para confirmar los detalles de entrega.\n\n` +
    `¡Gracias por comprar en Cabox — Curated Fashion! 🛍️`
  );
}

/** Build an "order shipped" notification. */
export function buildOrderShippedMessage(opts: {
  customerName: string;
  orderNumber:  string;
  trackingCode?: string;
}): string {
  const { customerName, orderNumber, trackingCode } = opts;
  return (
    `¡Hola ${customerName}! 📦\n\n` +
    `Tu pedido *${orderNumber}* ha sido enviado.\n` +
    (trackingCode ? `🔍 Código de rastreo: *${trackingCode}*\n\n` : '\n') +
    `Pronto lo recibirás en casa. ¡Gracias por tu compra en Cabox! 🎉`
  );
}
