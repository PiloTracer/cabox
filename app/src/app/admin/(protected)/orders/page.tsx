import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import type { Metadata } from 'next';
import { formatCRC, formatDate } from '@/lib/format';
import {
  ADMIN_ORDER_STATUS_BADGE,
  ADMIN_ORDER_STATUS_LABEL,
  ADMIN_PAYMENT_STATUS_BADGE,
  ADMIN_PAYMENT_STATUS_LABEL,
} from '@/lib/admin/order-labels';

export const metadata: Metadata = { title: 'Pedidos — Cabox Admin' };

interface Props {
  searchParams: Promise<{
    status?: string;
    page?: string;
    customerId?: string;
    paymentStatus?: string;
    from?: string;
    to?: string;
  }>;
}

const PAGE_SIZE = 20;

function buildOrderQueryLink(base: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) {
    if (v === undefined || v === '') continue;
    if (k === 'page' && v === '1') continue;
    qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `/admin/orders?${s}` : '/admin/orders';
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { status, page: pageStr, customerId, paymentStatus, from, to } = await searchParams;
  const page = parseInt(pageStr ?? '1', 10);
  const skip = (page - 1) * PAGE_SIZE;

  const createdAt: { gte?: Date; lte?: Date } = {};
  if (from?.trim()) {
    const d = new Date(`${from.trim()}T00:00:00.000`);
    if (!Number.isNaN(d.getTime())) createdAt.gte = d;
  }
  if (to?.trim()) {
    const d = new Date(`${to.trim()}T23:59:59.999`);
    if (!Number.isNaN(d.getTime())) createdAt.lte = d;
  }

  const where: import('@prisma/client').Prisma.OrderWhereInput = {
    ...(status ? { status: status as import('@prisma/client').OrderStatus } : {}),
    ...(customerId ? { customerId } : {}),
    ...(paymentStatus
      ? { paymentStatus: paymentStatus as import('@prisma/client').PaymentStatus }
      : {}),
    ...(Object.keys(createdAt).length ? { createdAt } : {}),
  };

  const [orders, total, filterCustomer] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: true,
        items: { take: 1 },
        tickets: {
          where: { type: 'PAYMENT_PROOF' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
    customerId
      ? prisma.customer.findUnique({
          where: { id: customerId },
          select: { id: true, name: true },
        })
      : Promise.resolve(null),
  ]);

  const pages = Math.ceil(total / PAGE_SIZE);
  const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  const paymentStatuses: import('@prisma/client').PaymentStatus[] = [
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED',
  ];

  const commonFilters = { status, customerId, paymentStatus, from, to };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>
            Pedidos ({total})
          </h1>
          {filterCustomer && (
            <p style={{ color: 'var(--color-text-muted)', marginTop: '0.35rem', fontSize: '0.9rem' }}>
              Filtrado por cliente: <strong>{filterCustomer.name}</strong>
              {' · '}
              <Link href="/admin/orders" style={{ color: 'var(--color-primary)' }}>
                Ver todos los pedidos
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="filter-bar" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Link
          href={buildOrderQueryLink({
            customerId,
            paymentStatus,
            from,
            to,
          })}
          className={`filter-chip ${!status ? 'active' : ''}`}
        >
          Todos (estado)
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={buildOrderQueryLink({
              status: s,
              customerId,
              paymentStatus,
              from,
              to,
            })}
            className={`filter-chip ${status === s ? 'active' : ''}`}
          >
            {ADMIN_ORDER_STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      <div className="filter-bar" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginRight: '0.25rem' }}>Pago:</span>
        <Link
          href={buildOrderQueryLink({ status, customerId, from, to })}
          className={`filter-chip ${!paymentStatus ? 'active' : ''}`}
        >
          Todos
        </Link>
        {paymentStatuses.map((ps) => (
          <Link
            key={ps}
            href={buildOrderQueryLink({
              status,
              customerId,
              paymentStatus: ps,
              from,
              to,
            })}
            className={`filter-chip ${paymentStatus === ps ? 'active' : ''}`}
          >
            {ADMIN_PAYMENT_STATUS_LABEL[ps] ?? ps}
          </Link>
        ))}
      </div>

      <form
        method="get"
        action="/admin/orders"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'flex-end',
          marginBottom: '1.5rem',
          padding: '1rem',
          background: 'var(--color-bg)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
        }}
      >
        {status && <input type="hidden" name="status" value={status} />}
        {customerId && <input type="hidden" name="customerId" value={customerId} />}
        {paymentStatus && <input type="hidden" name="paymentStatus" value={paymentStatus} />}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>
            Desde
          </label>
          <input className="input" type="date" name="from" defaultValue={from ?? ''} style={{ minWidth: '11rem' }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>
            Hasta
          </label>
          <input className="input" type="date" name="to" defaultValue={to ?? ''} style={{ minWidth: '11rem' }} />
        </div>
        <button type="submit" className="btn btn-secondary btn-sm">
          Aplicar fechas
        </button>
        {(from || to) && (
          <Link
            href={buildOrderQueryLink({ status, customerId, paymentStatus })}
            className="btn btn-ghost btn-sm"
          >
            Limpiar fechas
          </Link>
        )}
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Pago</th>
              <th>Comprobante</th>
              <th>Método</th>
              <th>Total</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  No hay pedidos
                </td>
              </tr>
            ) : orders.map((order) => {
              const manualPay =
                order.paymentMethod === 'SINPE' || order.paymentMethod === 'BANK_TRANSFER';
              const attachments = order.tickets[0]?.attachments as unknown;
              const proofUrls = Array.isArray(attachments)
                ? attachments.filter((u): u is string => typeof u === 'string' && u.length > 0)
                : [];
              const proofCell =
                !manualPay || order.paymentStatus === 'COMPLETED'
                  ? { label: '—', tone: 'muted' as const }
                  : proofUrls.length > 0
                    ? { label: 'Adjunto', tone: 'success' as const }
                    : { label: 'Falta', tone: 'warning' as const };

              return (
              <tr key={order.id}>
                <td>
                  <Link href={`/admin/orders/${order.id}`} style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                    {order.orderNumber}
                  </Link>
                </td>
                <td>
                  <div>
                    <p style={{ fontWeight: 500 }}>{order.customer.name}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{order.customer.phone}</p>
                  </div>
                </td>
                <td>
                  <span className={`badge badge-${ADMIN_ORDER_STATUS_BADGE[order.status] ?? 'muted'}`}>
                    {ADMIN_ORDER_STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-${ADMIN_PAYMENT_STATUS_BADGE[order.paymentStatus] ?? 'muted'}`}>
                    {ADMIN_PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}
                  </span>
                </td>
                <td>
                  <span
                    className={`badge badge-${
                      proofCell.tone === 'success'
                        ? 'success'
                        : proofCell.tone === 'warning'
                          ? 'warning'
                          : 'muted'
                    }`}
                    title={manualPay && order.paymentStatus !== 'COMPLETED' ? 'Pago manual: comprobante del cliente' : ''}
                  >
                    {proofCell.label}
                  </span>
                </td>
                <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{order.paymentMethod}</td>
                <td className="price">{formatCRC(order.total)}</td>
                <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  {formatDate(order.createdAt)}
                </td>
                <td>
                  <Link href={`/admin/orders/${order.id}`} className="btn btn-secondary btn-sm">
                    Ver
                  </Link>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={buildOrderQueryLink({
                  ...commonFilters,
                  page: String(p),
                })}
                className={`filter-chip ${p === page ? 'active' : ''}`}
              >
                {p}
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
