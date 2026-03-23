'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/cart-store';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface Props { locale: string }

const PROVINCES = [
  'San José', 'Alajuela', 'Cartago', 'Heredia',
  'Guanacaste', 'Puntarenas', 'Limón',
];

// All possible payment methods (label map)
const ALL_PAYMENT_METHODS = [
  { value: 'SINPE',        label: '📱 SINPE Móvil' },
  { value: 'BANK_TRANSFER', label: '🏦 Transferencia bancaria' },
  { value: 'CASH',          label: '💵 Efectivo (en entrega)' },
  { value: 'STRIPE',   label: '💳 Tarjeta de crédito/débito' },
  { value: 'PAYPAL',   label: '🅿️ PayPal' },
];

interface PaymentMethodConfig {
  enabled: boolean;
  phone?: string;
  accountName?: string;
  bankName?: string;
  iban?: string;
}

export default function CheckoutForm({ locale }: Props) {
  const t = useTranslations('checkout');
  const router = useRouter();
  const { items, subtotal, total, clearCart } = useCartStore();
  const [method, setMethod] = useState('SINPE');
  const [delivery, setDelivery] = useState<'pickup' | 'delivery'>('pickup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enabledMethods, setEnabledMethods] = useState(ALL_PAYMENT_METHODS);
  // Full config per method — used to display real instructions (phone, IBAN, etc.)
  const [methodConfig, setMethodConfig] = useState<Record<string, PaymentMethodConfig>>({});

  // Load enabled payment methods + their config from store settings
  useEffect(() => {
    fetch('/api/settings/payment-methods')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.methods && Object.keys(data.methods).length) {
          // Store full config for instruction rendering
          setMethodConfig(data.methods as Record<string, PaymentMethodConfig>);
          // Build the display list using the canonical order from ALL_PAYMENT_METHODS
          const filtered = ALL_PAYMENT_METHODS.filter(m => data.methods[m.value]?.enabled);
          setEnabledMethods(filtered.length ? filtered : ALL_PAYMENT_METHODS);
          // Default to first enabled method
          setMethod(filtered[0]?.value ?? 'SINPE');
        }
      })
      .catch(() => {}); // fail silently — show all methods as fallback
  }, []);

  const needsAddress = delivery === 'delivery';

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
      customerEmail: fd.get('email') || undefined,
      customerName: `${fd.get('firstName')} ${fd.get('lastName')}`,
      customerPhone: fd.get('phone'),
      shippingAddress: needsAddress ? {
        line1: fd.get('address') as string,
        city: fd.get('city') as string,
        province: fd.get('province') as string,
        country: 'CR',
      } : undefined,
      paymentMethod: method,
      currency: 'CRC',
      items: items.map((i) => ({
        productId: i.id,
        variantSku: i.variantId ?? null,
        nameEs: i.nameEs,
        nameEn: i.nameEn,
        quantity: i.quantity,
        price: i.price,
      })),
      subtotal: subtotal(),
      shippingCost: 0,
      tax: 0,
      discountAmount: 0,
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
      const detail = err.errors ? JSON.stringify(err.errors, null, 2) : '';
      setError((err.message ?? 'Error al procesar el pedido.') + (detail ? '\n' + detail : ''));
    }
  };

  /* ── Styles for required field labels ── */
  const requiredLabelStyle: React.CSSProperties = {
    fontWeight: 600,
    color: 'var(--color-heading)',
  };
  const requiredDotStyle: React.CSSProperties = {
    display: 'inline-block',
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--color-primary)',
    marginLeft: 6,
    verticalAlign: 'middle',
  };
  const requiredInputStyle: React.CSSProperties = {
    borderColor: 'var(--color-primary)',
    borderWidth: '1.5px',
  };
  const optionalInputStyle: React.CSSProperties = {};

  return (
    <div className="checkout-layout">
      {/* Form */}
      <form onSubmit={handleSubmit} className="checkout-form">
        {/* Contact info */}
        <div className="card card-body checkout-section">
          <h2 className="checkout-section-title">{t('customerInfo')}</h2>

          <div className="checkout-row">
            <div className="form-group">
              <label className="form-label" style={requiredLabelStyle}>
                Nombre <span style={requiredDotStyle} />
              </label>
              <input className="input" name="firstName" required style={requiredInputStyle} />
            </div>
            <div className="form-group">
              <label className="form-label" style={requiredLabelStyle}>
                Apellido <span style={requiredDotStyle} />
              </label>
              <input className="input" name="lastName" required style={requiredInputStyle} />
            </div>
          </div>

          <div className="checkout-row">
            <div className="form-group">
              <label className="form-label" style={requiredLabelStyle}>
                Teléfono <span style={requiredDotStyle} />
              </label>
              <input
                className="input"
                name="phone"
                type="tel"
                required
                placeholder="+506 8888-8888"
                style={requiredInputStyle}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Email <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span>
              </label>
              <input className="input" name="email" type="email" placeholder="correo@ejemplo.com" style={optionalInputStyle} />
            </div>
          </div>
        </div>

        {/* Delivery method */}
        <div className="card card-body checkout-section">
          <h2 className="checkout-section-title">Método de entrega</h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <label
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                borderRadius: 'var(--radius-lg)',
                border: delivery === 'pickup' ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                background: delivery === 'pickup' ? 'rgba(139,69,19,0.04)' : 'var(--color-bg)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="radio"
                name="delivery"
                checked={delivery === 'pickup'}
                onChange={() => setDelivery('pickup')}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: '1.5rem' }}>🏪</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Pasa a recoger</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Sin costo adicional</div>
              </div>
            </label>

            <label
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                borderRadius: 'var(--radius-lg)',
                border: delivery === 'delivery' ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                background: delivery === 'delivery' ? 'rgba(139,69,19,0.04)' : 'var(--color-bg)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="radio"
                name="delivery"
                checked={delivery === 'delivery'}
                onChange={() => setDelivery('delivery')}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: '1.5rem' }}>🚚</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Entrega a domicilio</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Coordinamos por WhatsApp</div>
              </div>
            </label>
          </div>
        </div>

        {/* Shipping address — only shown when delivery is selected */}
        {needsAddress && (
        <div className="card card-body checkout-section">
          <h2 className="checkout-section-title">
            Dirección de entrega
          </h2>
          <div className="form-group">
            <label className="form-label" style={requiredLabelStyle}>
              Dirección <span style={requiredDotStyle} />
            </label>
            <input
              className="input"
              name="address"
              required={needsAddress}
              placeholder="Calle, número, barrio, señas adicionales"
              style={requiredInputStyle}
            />
          </div>
          <div className="checkout-row">
            <div className="form-group">
              <label className="form-label" style={requiredLabelStyle}>
                Ciudad <span style={requiredDotStyle} />
              </label>
              <input className="input" name="city" required={needsAddress} style={requiredInputStyle} />
            </div>
            <div className="form-group">
              <label className="form-label" style={requiredLabelStyle}>
                Provincia <span style={requiredDotStyle} />
              </label>
              <select className="input" name="province" required={needsAddress} style={requiredInputStyle}>
                <option value="">Seleccionar…</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>
        )}


        {/* Payment */}
        <div className="card card-body checkout-section">
          <h2 className="checkout-section-title">{t('paymentMethod')}</h2>
          <div className="payment-methods">
            {enabledMethods.map((m) => (
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

          {/* Payment instructions — dynamic from admin config */}
          {method === 'SINPE' && (
            <div className="payment-instructions">
              {methodConfig.SINPE?.phone ? (
                <>
                  <p>📱 Realiza tu pago por <strong>SINPE Móvil</strong> al número:</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.5rem 0', letterSpacing: '0.03em' }}>
                    {methodConfig.SINPE.phone}
                  </p>
                  {methodConfig.SINPE.accountName && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                      A nombre de: <strong>{methodConfig.SINPE.accountName}</strong>
                    </p>
                  )}
                  <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Envía el comprobante de pago junto con tu número de pedido.
                  </p>
                </>
              ) : (
                <p>📱 Las instrucciones de SINPE Móvil se mostrarán al confirmar el pedido.</p>
              )}
            </div>
          )}

          {method === 'BANK_TRANSFER' && (
            <div className="payment-instructions">
              {methodConfig.BANK_TRANSFER?.iban ? (
                <>
                  <p>🏦 Realiza una transferencia bancaria a:</p>
                  {methodConfig.BANK_TRANSFER.bankName && (
                    <p style={{ fontWeight: 600, margin: '0.4rem 0 0.2rem' }}>{methodConfig.BANK_TRANSFER.bankName}</p>
                  )}
                  <p style={{ fontFamily: 'monospace', fontSize: '0.9rem', background: 'rgba(0,0,0,0.04)', padding: '6px 10px', borderRadius: 6, margin: '0.25rem 0' }}>
                    {methodConfig.BANK_TRANSFER.iban}
                  </p>
                  {methodConfig.BANK_TRANSFER.accountName && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                      A nombre de: <strong>{methodConfig.BANK_TRANSFER.accountName}</strong>
                    </p>
                  )}
                </>
              ) : (
                <p>🏦 Los datos bancarios aparecerán al confirmar el pedido.</p>
              )}
            </div>
          )}

          {method === 'CASH' && (
            <div className="payment-instructions">
              <p>💵 Pago en efectivo al momento de la entrega. Coordinamos la entrega por WhatsApp.</p>
            </div>
          )}
        </div>

        {/* Required fields legend */}
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ ...requiredDotStyle, marginLeft: 0 }} /> Campos requeridos
        </p>

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
            <span>Entrega</span>
            <span>{delivery === 'pickup' ? 'Gratis (recoger)' : 'Por calcular'}</span>
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
