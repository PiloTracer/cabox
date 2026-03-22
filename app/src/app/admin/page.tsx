import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ShoppingBag, Package, TrendingUp } from 'lucide-react';
import { formatCRC, formatDate } from '@/lib/format';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  const [productCount, orderCount, pendingOrders] = await Promise.all([
    prisma.product.count({ where: { status: 'ACTIVE' } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
  ]);

  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { items: { take: 1 } },
  });

  const stats = [
    { label: 'Productos activos', value: productCount, icon: ShoppingBag, href: '/admin/products' },
    { label: 'Pedidos totales', value: orderCount, icon: Package, href: '/admin/orders' },
    { label: 'Pedidos pendientes', value: pendingOrders, icon: TrendingUp, href: '/admin/orders?status=PENDING' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>
            Bienvenido, {session?.user?.name ?? 'Admin'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Resumen de tu tienda Cabox
          </p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          + Nuevo producto
        </Link>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid">
        {stats.map((s) => (
          <Link href={s.href} key={s.label} className="admin-stat-card">
            <div className="admin-stat-icon">
              <s.icon size={22} />
            </div>
            <div>
              <p className="admin-stat-value">{s.value}</p>
              <p className="admin-stat-label">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Pedidos recientes
          </h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nº pedido</th>
                  <th>Estado</th>
                  <th>Pago</th>
                  <th>Total</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} style={{ fontWeight: 500 }}>
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td><span className={`badge badge-${statusBadge(order.status)}`}>{order.status}</span></td>
                    <td><span className={`badge badge-${payBadge(order.paymentStatus)}`}>{order.paymentStatus}</span></td>
                    <td className="price">{formatCRC(order.total)}</td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    PENDING: 'warning', CONFIRMED: 'success', PROCESSING: 'new',
    SHIPPED: 'new', DELIVERED: 'success', CANCELLED: 'error',
  };
  return map[s] ?? 'muted';
}

function payBadge(s: string) {
  const map: Record<string, string> = { UNPAID: 'warning', PAID: 'success', REFUNDED: 'muted' };
  return map[s] ?? 'muted';
}
