import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Inventario — Cabox Admin' };

export default async function AdminInventoryPage() {
  const records = await prisma.inventoryRecord.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
  });

  const productIds = records.map((r) => r.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: { not: 'ARCHIVED' } },
    select: { id: true, nameEs: true, sku: true, status: true, images: { take: 1, orderBy: { position: 'asc' } } },
  });

  const stockMap = Object.fromEntries(records.map((r) => [r.productId, r._sum.quantity ?? 0]));
  const inventory = products
    .map((p) => ({ ...p, stock: stockMap[p.id] ?? 0 }))
    .sort((a, b) => a.stock - b.stock);

  const LOW_STOCK = 5;

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Inventario</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {inventory.filter((i) => i.stock <= LOW_STOCK).length} productos con stock bajo
          </p>
        </div>
        <Link href="/admin/inventory/adjust" className="btn btn-primary">+ Ajustar Stock</Link>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th>Estado</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.id} style={item.stock <= LOW_STOCK ? { background: 'rgba(239,68,68,0.04)' } : {}}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {item.images[0]?.url && (
                      <img src={item.images[0].url} alt={item.nameEs} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '0.375rem', flexShrink: 0 }} />
                    )}
                    <Link href={`/admin/products/${item.id}/edit`} style={{ fontWeight: 500 }}>
                      {item.nameEs}
                    </Link>
                  </div>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{item.sku}</td>
                <td>
                  <span className={`badge badge-${item.status === 'ACTIVE' ? 'success' : 'muted'}`}>{item.status}</span>
                </td>
                <td>
                  <span style={{
                    fontWeight: 700,
                    color: item.stock === 0 ? 'var(--color-accent)' : item.stock <= LOW_STOCK ? '#d97706' : 'inherit',
                  }}>
                    {item.stock === 0 ? '⚠ Agotado' : item.stock <= LOW_STOCK ? `⚠ ${item.stock}` : item.stock}
                  </span>
                </td>
              </tr>
            ))}
            {inventory.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Sin registros de inventario</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
