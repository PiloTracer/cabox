import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Estado de pedido — Cabox' };

interface Props { params: Promise<{ orderNumber: string }> }

const STATUS_ES: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmado', PROCESSING: 'En proceso',
  SHIPPED: 'Enviado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado',
};
const PAY_ES: Record<string, string> = {
  UNPAID: 'Sin pagar', PAID: 'Pagado', REFUNDED: 'Reembolsado',
};
const METHOD_ES: Record<string, string> = {
  SINPE: 'SINPE Móvil', STRIPE: 'Tarjeta', PAYPAL: 'PayPal',
  TRANSFER: 'Transferencia', CASH: 'Efectivo',
};

function StepDot({ done, active }: { done: boolean; active: boolean }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      background: done ? 'var(--color-success)' : active ? 'var(--color-primary)' : 'var(--color-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: '0.75rem', fontWeight: 700,
    }}>
      {done ? '✓' : ''}
    </div>
  );
}

export default async function OrderStatusPage({ params }: Props) {
  const { orderNumber } = await params;
  const locale = await getLocale();

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });

  if (!order) notFound();

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CR', { style: 'currency', currency: order.currency, maximumFractionDigits: 0 }).format(n);

  const steps = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const currentStep = steps.indexOf(order.status);

  const addr = order.shippingAddress as Record<string, string>;

  return (
    <div className="container" style={{ paddingBlock: '3rem', maxWidth: '720px' }}>
      {/* Header */}
      <div className="order-confirm-header">
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
          {order.status === 'DELIVERED' ? '🎉' : order.status === 'CANCELLED' ? '❌' : '📦'}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)' }}>
          {order.status === 'DELIVERED' ? '¡Pedido entregado!' :
           order.status === 'CANCELLED' ? 'Pedido cancelado' :
           '¡Pedido recibido!'}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
          Número de pedido: <strong>{order.orderNumber}</strong>
        </p>
      </div>

      {/* Progress bar */}
      {order.status !== 'CANCELLED' && (
        <div className="order-progress">
          {steps.map((s, i) => (
            <div key={s} className="order-step">
              <StepDot done={i < currentStep} active={i === currentStep} />
              <span className={`order-step-label ${i <= currentStep ? 'active' : ''}`}>
                {STATUS_ES[s]}
              </span>
              {i < steps.length - 1 && <div className="order-step-line" />}
            </div>
          ))}
        </div>
      )}

      <div className="order-cards">
        {/* Order details */}
        <div className="card card-body">
          <h2 className="checkout-section-title">Resumen del pedido</h2>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            {order.items.map((item) => (
              <li key={item.id} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
                <span>{locale === 'es' ? item.nameEs : item.nameEn} <span style={{ color: 'var(--color-text-muted)' }}>×{item.quantity}</span></span>
                <span className="price">{fmt(Number(item.totalPrice))}</span>
              </li>
            ))}
          </ul>
          <hr style={{ borderColor: 'var(--color-border-light)', marginBottom: '0.75rem' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.125rem' }}>
            <span>Total</span>
            <span className="price">{fmt(Number(order.total))}</span>
          </div>
        </div>

        {/* Payment + shipping */}
        <div className="card card-body">
          <h2 className="checkout-section-title">Información de entrega</h2>
          <dl className="order-dl">
            <dt>Cliente</dt><dd>{order.customerName}</dd>
            <dt>Email</dt><dd>{order.customerEmail}</dd>
            {order.customerPhone && <><dt>Teléfono</dt><dd>{order.customerPhone}</dd></>}
            <dt>Dirección</dt><dd>{addr.line1}, {addr.city}, {addr.province}</dd>
            <dt>Método de pago</dt><dd>{METHOD_ES[order.paymentMethod] ?? order.paymentMethod}</dd>
            <dt>Estado de pago</dt>
            <dd>
              <span className={`badge badge-${order.paymentStatus === 'PAID' ? 'success' : order.paymentStatus === 'UNPAID' ? 'warning' : 'muted'}`}>
                {PAY_ES[order.paymentStatus] ?? order.paymentStatus}
              </span>
            </dd>
          </dl>

          {/* SINPE instructions */}
          {order.paymentMethod === 'SINPE' && order.paymentStatus === 'UNPAID' && (
            <div className="payment-instructions" style={{ marginTop: '1rem' }}>
              <strong>📱 Instrucciones SINPE Móvil</strong>
              <p style={{ marginTop: '0.5rem' }}>
                Envía <strong>{fmt(Number(order.total))}</strong> al número SINPE de la tienda.
                Incluye el número de pedido <strong>{order.orderNumber}</strong> como referencia.
              </p>
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link href={`/${locale}/products`} className="btn btn-secondary">
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
