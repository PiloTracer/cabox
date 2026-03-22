'use client';

import { useState } from 'react';
import { useCartStore } from '@/stores/cart-store';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface Props { locale: string }

const PROVINCES = [
  'San José', 'Alajuela', 'Cartago', 'Heredia',
  'Guanacaste', 'Puntarenas', 'Limón',
];

const PAYMENT_METHODS = [
  { value: 'STRIPE', label: '💳 Tarjeta de crédito/débito' },
  { value: 'PAYPAL', label: '🅿️ PayPal' },
  { value: 'SINPE', label: '📱 SINPE Móvil' },
  { value: 'TRANSFER', label: '🏦 Transferencia bancaria' },
  { value: 'CASH', label: '💵 Efectivo (en entrega)' },
];

export default function CheckoutForm({ locale }: Props) {
  const t = useTranslations('checkout');
  const router = useRouter();
  const { items, subtotal, total, clearCart } = useCartStore();
  const [method, setMethod] = useState('SINPE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n);

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</p>
        <h2>Tu carrito está vacío</h2>
        <Link href={`/${locale}/products`} className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
          Ver productos
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);

    const payload = {
      customerEmail: fd.get('email'),
      customerName: `${fd.get('firstName')} ${fd.get('lastName')}`,
      customerPhone: fd.get('phone'),
      shippingAddress: {
        line1: fd.get('address'),
        city: fd.get('city'),
        province: fd.get('province'),
        country: 'CR',
      },
      paymentMethod: method,
      currency: 'CRC',
      items: items.map((i) => ({
        productId: i.id,
        variantId: i.variantId ?? null,
        sku: i.sku,
        nameEs: i.nameEs,
        nameEn: i.nameEn,
        quantity: i.quantity,
        unitPrice: i.price,
        totalPrice: i.price * i.quantity,
      })),
      subtotal: subtotal(),
      shipping: 0,
      tax: 0,
      discount: 0,
      total: total(),
    };

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (res.ok) {
      const order = await res.json();
      clearCart();
      router.push(`/${locale}/orders/${order.orderNumber}`);
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.message ?? 'Error al procesar el pedido. Intenta de nuevo.');
    }
  };

  return (
    <div className="checkout-layout">
      {/* Form */}
      <form onSubmit={handleSubmit} className="checkout-form">
        {/* Contact */}
        <div className="card card-body checkout-section">
          <h2 className="checkout-section-title">{t('customerInfo')}</h2>
          <div className="checkout-row">
            <div className="form-group">
              <label className="form-label">{t('firstName')} *</label>
              <input className="input" name="firstName" required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('lastName')} *</label>
              <input className="input" name="lastName" required />
            </div>
          </div>
          <div className="checkout-row">
            <div className="form-group">
              <label className="form-label">{t('email')} *</label>
              <input className="input" name="email" type="email" required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('phone')} *</label>
              <input className="input" name="phone" type="tel" required placeholder="+506 8888-8888" />
            </div>
          </div>
        </div>

        {/* Shipping */}
        <div className="card card-body checkout-section">
          <h2 className="checkout-section-title">{t('shippingAddress')}</h2>
          <div className="form-group">
            <label className="form-label">{t('address')} *</label>
            <input className="input" name="address" required />
          </div>
          <div className="checkout-row">
            <div className="form-group">
              <label className="form-label">{t('city')} *</label>
              <input className="input" name="city" required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('province')} *</label>
              <select className="input" name="province" required>
                <option value="">Seleccionar…</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="card card-body checkout-section">
          <h2 className="checkout-section-title">{t('paymentMethod')}</h2>
          <div className="payment-methods">
            {PAYMENT_METHODS.map((m) => (
              <label key={m.value} className={`payment-method ${method === m.value ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value={m.value}
                  checked={method === m.value}
                  onChange={() => setMethod(m.value)}
                  style={{ display: 'none' }}
                />
                {m.label}
              </label>
            ))}
          </div>

          {/* SINPE instructions */}
          {method === 'SINPE' && (
            <div className="payment-instructions">
              <p>📱 Enviar el monto al <strong>número de SINPE</strong> registrado.</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                Las instrucciones completas se mostrarán al confirmar el pedido.
              </p>
            </div>
          )}

          {method === 'TRANSFER' && (
            <div className="payment-instructions">
              <p>🏦 Transferencia bancaria. Los datos bancarios aparecerán al confirmar el pedido.</p>
            </div>
          )}

          {method === 'CASH' && (
            <div className="payment-instructions">
              <p>💵 Pago en efectivo al momento de la entrega. Coordinamos la entrega por WhatsApp.</p>
            </div>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
        >
          {loading ? 'Procesando…' : `${t('placeOrder')} — ${fmt(total())}`}
        </button>
      </form>

      {/* Order summary */}
      <aside className="checkout-summary card card-body">
        <h2 className="checkout-section-title">{t('orderSummary')}</h2>
        <ul className="checkout-items">
          {items.map((item) => (
            <li key={`${item.id}-${item.variantId ?? ''}`} className="checkout-item">
              <span className="checkout-item-name">{item.nameEs}</span>
              <span className="checkout-item-qty">×{item.quantity}</span>
              <span className="price">{fmt(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="checkout-totals">
          <div className="checkout-total-row">
            <span>{t('subtotal')}</span>
            <span>{fmt(subtotal())}</span>
          </div>
          <div className="checkout-total-row">
            <span>{t('shipping')}</span>
            <span>Por calcular</span>
          </div>
          <div className="checkout-total-row checkout-grand-total">
            <span>{t('total')}</span>
            <span className="price">{fmt(total())}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
