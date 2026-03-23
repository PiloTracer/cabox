import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import OrderStatusForm from '@/components/admin/OrderStatusForm';
import { formatCRC, formatDate, formatDateTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Detalle del Pedido — Cabox Admin' };

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'warning', CONFIRMED: 'success', PROCESSING: 'new',
  SHIPPED: 'new', DELIVERED: 'success', CANCELLED: 'error',
};
const PAY_BADGE: Record<string, string> = {
  PENDING: 'warning', COMPLETED: 'success', FAILED: 'error', REFUNDED: 'muted',
};
const TIMELINE_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          product: { select: { slug: true, images: { take: 1, orderBy: { position: 'asc' } } } },
        },
      },
      invoices: { orderBy: { createdAt: 'desc' } },
      tickets: { where: { type: 'PAYMENT_PROOF' }, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!order) notFound();

  const addr = order.shippingAddress as Record<string, string>;
  const currentStep = TIMELINE_STEPS.indexOf(order.status);

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Link href="/admin/orders" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          ← Pedidos
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', flex: 1 }}>
          {order.orderNumber}
        </h1>
        <span className={`badge badge-${STATUS_BADGE[order.status] ?? 'muted'}`} style={{ fontSize: '0.85rem' }}>
          {order.status}
        </span>
        <span className={`badge badge-${PAY_BADGE[order.paymentStatus] ?? 'muted'}`} style={{ fontSize: '0.85rem' }}>
          {order.paymentStatus}
        </span>
      </div>

      {/* Progress Timeline */}
      {order.status !== 'CANCELLED' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, margin: '1.5rem 0', overflowX: 'auto' }}>
          {TIMELINE_STEPS.map((step, idx) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '80px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: '2rem', height: '2rem', borderRadius: '50%',
                  background: idx <= currentStep ? 'var(--color-primary)' : 'var(--color-border)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700,
                }}>
                  {idx < currentStep ? '✓' : idx + 1}
                </div>
                <span style={{ fontSize: '0.7rem', marginTop: '0.3rem', color: idx <= currentStep ? 'var(--color-primary)' : 'var(--color-text-muted)', textAlign: 'center' }}>
                  {step}
                </span>
              </div>
              {idx < TIMELINE_STEPS.length - 1 && (
                <div style={{ height: '2px', flex: 1, background: idx < currentStep ? 'var(--color-primary)' : 'var(--color-border)', minWidth: '20px' }} />
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Order items */}
          <div className="admin-card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '1rem' }}>
              Artículos ({order.items.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {order.items.map((item) => {
                const img = item.product.images[0]?.url;
                return (
                  <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem', background: 'var(--color-bg)', borderRadius: '0.5rem' }}>
                    {img && (
                      <img src={img} alt={item.nameEs} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '0.375rem', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.nameEs}</p>
                      {item.variantSku && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>SKU: {item.variantSku}</p>
                      )}
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {item.quantity} × {formatCRC(item.price)}
                      </p>
                    </div>
                    <p style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {formatCRC(Number(item.price) * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '1rem', paddingTop: '1rem' }}>
              {([
                ['Subtotal', formatCRC(order.subtotal)],
                order.discountAmount && Number(order.discountAmount) > 0 ? ['Descuento', `−${formatCRC(order.discountAmount)}`] : null,
                ['Envío', formatCRC(order.shippingCost)],
                ['Impuesto', formatCRC(order.tax)],
              ].filter(Boolean) as [string, string][]).map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  <span>{label}</span><span>{value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0 0', fontWeight: 700, fontSize: '1rem', borderTop: '1px solid var(--color-border)', marginTop: '0.25rem' }}>
                <span>Total</span><span>{formatCRC(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Status update form */}
          <OrderStatusForm
            orderId={order.id}
            currentStatus={order.status}
            currentPaymentStatus={order.paymentStatus}
            currentNotes={order.notes ?? ''}
          />
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Customer */}
          <div className="admin-card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '0.75rem' }}>Cliente</h3>
            <p style={{ fontWeight: 600 }}>{order.customer.name}</p>
            {order.customer.email && <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{order.customer.email}</p>}
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{order.customer.phone}</p>
            {order.customer.phone && (
              <a
                href={`https://wa.me/${order.customer.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                💬 WhatsApp
              </a>
            )}
          </div>

          {/* Shipping address - only for home delivery */}
          {addr?.line1 && (
          <div className="admin-card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '0.75rem' }}>Dirección de Envío</h3>
            <address style={{ fontStyle: 'normal', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-muted)' }}>
              {addr.line1}<br />
              {addr.line2 && <>{addr.line2}<br /></>}
              {addr.city}, {addr.province}<br />
              {addr.postalCode && <>{addr.postalCode}<br /></>}
              {addr.country ?? 'CR'}
            </address>
          </div>
          )}

          {/* Payment */}
          <div className="admin-card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '0.75rem' }}>Pago</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Método</span>
                <span style={{ fontWeight: 600 }}>{
                  ({ SINPE: 'SINPE Móvil', BANK_TRANSFER: 'Transferencia', CASH: 'Efectivo', CREDIT_CARD: 'Tarjeta', PAYPAL: 'PayPal' } as Record<string, string>)[order.paymentMethod] ?? order.paymentMethod
                }</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Estado</span>
                <span className={`badge badge-${PAY_BADGE[order.paymentStatus] ?? 'muted'}`}>{order.paymentStatus}</span>
              </div>
              {order.paymentRef && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Ref.</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{order.paymentRef}</span>
                </div>
              )}
              {order.couponCode && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Cupón</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{order.couponCode}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order metadata */}
          <div className="admin-card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '0.75rem' }}>Información</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Creado</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Actualizado</span>
                <span>{formatDateTime(order.updatedAt)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Locale</span>
                <span>{order.locale}</span>
              </div>
            </div>
          </div>
          {/* Payment proof thumbnails (from tickets) */}
          {order.tickets.length > 0 && (
          <div className="admin-card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '0.75rem' }}>📎 Comprobantes de Pago</h3>
            {order.tickets.map((ticket) => {
              const urls = ticket.attachments as string[];
              return urls.map((url, i) => (
                <a key={`${ticket.id}-${i}`} href={url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginRight: '0.5rem', marginBottom: '0.5rem' }}>
                  <img src={url} alt={`Comprobante ${i + 1}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }} />
                </a>
              ));
            })}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
