import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Productos</h1>
        <Link href="/admin/products/new" className="btn btn-primary">
          + Nuevo producto
        </Link>
      </div>

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
              const images = p.images as string[];
              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ width: 48, height: 48, position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--color-border-light)' }}>
                      {images[0] && (
                        <Image src={images[0]} alt={p.nameEs} fill sizes="48px" style={{ objectFit: 'cover' }} />
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
                  <td className="price">{fmt(Number(p.price))}</td>
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
    </div>
  );
}
