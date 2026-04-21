/**
 * Store `paymentMethods` JSON uses `TRANSFER` in the admin UI; Prisma/checkout use `BANK_TRANSFER`.
 * Keep both keys in sync when reading/writing settings.
 */

export function normalizePaymentMethodsJson(input: unknown): Record<string, unknown> {
  const defaults = (): Record<string, unknown> => ({
    SINPE: { enabled: true, phone: '', accountName: '' },
    TRANSFER: { enabled: false, bankName: '', iban: '', accountName: '' },
    BANK_TRANSFER: { enabled: false, bankName: '', iban: '', accountName: '' },
    CASH: { enabled: true },
    STRIPE: { enabled: false },
    PAYPAL: { enabled: false },
  });

  const base =
    typeof input === 'object' && input !== null && !Array.isArray(input)
      ? { ...defaults(), ...(input as Record<string, unknown>) }
      : defaults();

  const tr = base.TRANSFER as Record<string, unknown> | undefined;
  const bk = base.BANK_TRANSFER as Record<string, unknown> | undefined;
  const transferSource = tr ?? bk;
  if (transferSource && typeof transferSource === 'object') {
    const merged = { ...transferSource };
    base.TRANSFER = merged;
    base.BANK_TRANSFER = merged;
  }

  return base;
}
