'use client';

import { useState } from 'react';

/**
 * Copy helpers for manual payment flow on the post-checkout order page.
 */
export default function OrderPaymentCopyActions({
  orderNumber,
  amountDigits,
  sinpePhone,
  iban,
}: {
  orderNumber: string;
  /** Digits only (CRC) for pasting into mobile banking */
  amountDigits: string;
  sinpePhone?: string | null;
  iban?: string | null;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2200);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => copy('order', orderNumber)}
      >
        {copied === 'order' ? '✓ Copiado' : `Copiar número de pedido`}
      </button>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => copy('amount', amountDigits)}
      >
        {copied === 'amount' ? '✓ Copiado' : 'Copiar monto (₡)'}
      </button>
      {sinpePhone && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => copy('sinpe', sinpePhone.replace(/\s/g, ''))}
        >
          {copied === 'sinpe' ? '✓ Copiado' : 'Copiar número SINPE'}
        </button>
      )}
      {iban && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => copy('iban', iban.replace(/\s/g, ''))}
        >
          {copied === 'iban' ? '✓ Copiado' : 'Copiar IBAN'}
        </button>
      )}
    </div>
  );
}
