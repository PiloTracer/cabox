import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { formatCRC, formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Reportes — Cabox Admin' };

export default async function AdminReportsPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalOrders,
    totalRevenue,
    ordersThisMonth,
    revenueThisMonth,
    ordersLastMonth,
    revenueLastMonth,
    topProducts,
    ordersByStatus,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'COMPLETED' } }),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: startOfMonth }, paymentStatus: 'COMPLETED' } }),
    prisma.order.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth }, paymentStatus: 'COMPLETED' } }),
    prisma.orderItem.groupBy({ by: ['productId'], _sum: { quantity: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 5 }),
    prisma.order.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.order.findMany({
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const productIds = topProducts.map((t) => t.productId);
  const productsData = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, nameEs: true, sku: true },
  });
  const productMap = Object.fromEntries(productsData.map((p) => [p.id, p]));

  const revenueTotal = Number(totalRevenue._sum.total ?? 0);
  const revThis = Number(revenueThisMonth._sum.total ?? 0);
  const revLast = Number(revenueLastMonth._sum.total ?? 0);
  const revGrowth = revLast > 0 ? ((revThis - revLast) / revLast) * 100 : 0;
  const orderGrowth = ordersLastMonth > 0 ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100 : 0;

  const statusColors: Record<string, string> = {
    PENDING: '#f59e0b', CONFIRMED: '#3b82f6', PROCESSING: '#8b5cf6',
    SHIPPED: '#06b6d4', DELIVERED: '#10b981', CANCELLED: '#ef4444',
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Reportes</h1>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Ingresos Totales', value: formatCRC(revenueTotal), sub: 'pedidos pagados' },
          { label: 'Este Mes', value: formatCRC(revThis), sub: `${revGrowth >= 0 ? '+' : ''}${revGrowth.toFixed(1)}% vs mes anterior`, color: revGrowth >= 0 ? 'green' : 'var(--color-accent)' },
          { label: 'Pedidos Totales', value: totalOrders.toString(), sub: 'todos los estados' },
          { label: 'Pedidos Este Mes', value: ordersThisMonth.toString(), sub: `${orderGrowth >= 0 ? '+' : ''}${orderGrowth.toFixed(1)}% vs mes anterior`, color: orderGrowth >= 0 ? 'green' : 'var(--color-accent)' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="admin-card">
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{label}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{value}</p>
            <p style={{ fontSize: '0.78rem', color: color ?? 'var(--color-text-muted)', marginTop: '0.25rem' }}>{sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Orders by status */}
        <div className="admin-card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '1rem' }}>Pedidos por Estado</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {ordersByStatus.map(({ status, _count }) => {
              const total = ordersByStatus.reduce((s, r) => s + r._count.id, 0);
              const pct = total > 0 ? (_count.id / total) * 100 : 0;
              return (
                <div key={status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', fontSize: '0.85rem' }}>
                    <span>{status}</span><span style={{ fontWeight: 600 }}>{_count.id}</span>
                  </div>
                  <div style={{ background: 'var(--color-border)', borderRadius: '4px', height: '6px' }}>
                    <div style={{ background: statusColors[status] ?? '#94a3b8', width: `${pct}%`, height: '100%', borderRadius: '4px', transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top products */}
        <div className="admin-card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '1rem' }}>Top 5 Productos Vendidos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {topProducts.map((t, i) => {
              const p = productMap[t.productId];
              return (
                <div key={t.productId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-text-muted)', minWidth: '20px' }}>#{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p?.nameEs ?? t.productId}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{p?.sku}</p>
                  </div>
                  <span style={{ fontWeight: 700 }}>{t._sum.quantity ?? 0} uds.</span>
                </div>
              );
            })}
            {topProducts.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>Sin ventas aún</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="admin-card">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '1rem' }}>Pedidos Recientes</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Fecha</th></tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{o.orderNumber}</td>
                  <td>{o.customer.name}</td>
                  <td className="price">{formatCRC(o.total)}</td>
                  <td><span className="badge badge-muted">{o.status}</span></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
