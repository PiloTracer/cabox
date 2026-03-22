import { getLocale } from 'next-intl/server';
import CheckoutForm from '@/components/store/CheckoutForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pagar — Cabox',
};

export default async function CheckoutPage() {
  const locale = await getLocale();
  return (
    <div className="container" style={{ paddingBlock: '2.5rem' }}>
      <h1 style={{ marginBottom: '2rem', fontFamily: 'var(--font-display)' }}>Finalizar pedido</h1>
      <CheckoutForm locale={locale} />
    </div>
  );
}
