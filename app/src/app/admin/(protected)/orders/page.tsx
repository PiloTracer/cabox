import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import type { Metadata } from 'next';
import { formatCRC, formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Pedidos — Cabox Admin' };

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmado', PROCESSING: 'En proceso',
  SHIPPED: 'Enviado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado',
};
const STATUS_BADGE: Record<string, string> = {
  PENDING: 'warning', CONFIRMED: 'success', PROCESSING: 'new',
  SHIPPED: 'new', DELIVERED: 'success', CANCELLED: 'error',
};
const PAY_BADGE: Record<string, string> = {
  PENDING: 'warning', COMPLETED: 'success', FAILED: 'error', REFUNDED: 'muted',
};
const PAY_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', COMPLETED: 'Pagado', FAILED: 'Fallido', REFUNDED: 'Reembolsado',
};

interface Props {
  searchParams: Promise<{ status?: string; page?: string }>;
}

const PAGE_SIZE = 20;

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { status, page: pageStr } = await searchParams;
  const page = parseInt(pageStr ?? '1', 10);
  const skip = (page - 1) * PAGE_SIZE;

  const where = status ? { status: status as import('@prisma/client').OrderStatus } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { customer: true, items: { take: 1 } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);

  const pages = Math.ceil(total / PAGE_SIZE);
  const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>
          Pedidos ({total})
        </h1>
      </div>

      {/* Status filter tabs */}
      <div className="filter-bar" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Link href="/admin/orders" className={`filter-chip ${!status ? 'active' : ''}`}>
          Todos
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`filter-chip ${status === s ? 'active' : ''}`}
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Pago</th>
              <th>Método</th>
              <th>Total</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  No hay pedidos
                </td>
              </tr>
            ) : orders.map((order) => (
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
                  <span className={`badge badge-${STATUS_BADGE[order.status] ?? 'muted'}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-${PAY_BADGE[order.paymentStatus] ?? 'muted'}`}>
                    {PAY_LABEL[order.paymentStatus] ?? order.paymentStatus}
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
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/orders?${status ? `status=${status}&` : ''}page=${p}`}
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
