import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { formatCRC } from '@/lib/format';

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true, images: { orderBy: { position: 'asc' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Productos</h1>
        <Link href="/admin/products/new" className="btn btn-primary">
          + Nuevo producto
        </Link>
      </div>

      {products.length === 0 && (
        <div className="card card-body" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No hay productos aún.</p>
          <Link href="/admin/products/new" className="btn btn-primary">Agregar primer producto</Link>
        </div>
      )}

      {products.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Destacado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const thumb = p.images[0]?.url ?? null;
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ width: 80, height: 80, position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--color-border-light)', flexShrink: 0 }}>
                        {thumb ? (
                          <Image src={thumb} alt={p.nameEs} fill sizes="80px" style={{ objectFit: 'cover' }} />
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1.25rem' }}>🛍️</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <p style={{ fontWeight: 500 }}>{p.nameEs}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>SKU: {p.sku}</p>
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{p.category?.nameEs ?? '—'}</td>
                    <td className="price">{formatCRC(p.price)}</td>
                    <td>
                      <span className={`badge badge-${p.status === 'ACTIVE' ? 'success' : p.status === 'DRAFT' ? 'warning' : 'muted'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>{p.featured ? '⭐' : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link href={`/admin/products/${p.id}/edit`} className="btn btn-secondary btn-sm">
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
