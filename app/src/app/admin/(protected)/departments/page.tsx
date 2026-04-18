import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = { title: 'Departamentos — Cabox Admin' };

export default async function AdminDepartmentsPage() {
  const departments = await prisma.department.findMany({
    orderBy: [{ position: 'asc' }, { nameEs: 'asc' }],
    include: {
      _count: { select: { categories: true, products: true } },
    },
  });

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>
            Departamentos
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem', maxWidth: '42rem' }}>
            Los departamentos agrupan categorías y rutas del storefront (<code>/es/[slug]</code>). El
            departamento General es obligatorio para el catálogo por defecto.
          </p>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Slug</th>
              <th>Estado</th>
              <th>Cat.</th>
              <th>Prod.</th>
              <th>Tienda</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{d.nameEs}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {d.nameEn}
                  </div>
                  {d.isDefault && (
                    <span className="badge badge-success" style={{ marginTop: '0.35rem' }}>
                      Por defecto
                    </span>
                  )}
                </td>
                <td>
                  <code style={{ fontSize: '0.85rem' }}>{d.slug}</code>
                </td>
                <td>
                  <span className={`badge badge-${d.isActive ? 'success' : 'muted'}`}>
                    {d.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>{d._count.categories}</td>
                <td>{d._count.products}</td>
                <td>
                  <Link href={`/es/${d.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
