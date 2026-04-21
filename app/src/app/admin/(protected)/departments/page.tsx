import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import DepartmentsClient from '@/components/admin/DepartmentsClient';

export const metadata: Metadata = { title: 'Departamentos — Cabox Admin' };

export default async function AdminDepartmentsPage() {
  const departments = await prisma.department.findMany({
    orderBy: [{ position: 'asc' }, { nameEs: 'asc' }],
    include: {
      _count: { select: { categories: true, products: true } },
    },
  });

  const positions = departments.map((d) => d.position);
  const nextPosition = positions.length ? Math.max(...positions) + 1 : 0;

  const rows = departments.map((d) => ({
    id: d.id,
    slug: d.slug,
    nameEs: d.nameEs,
    nameEn: d.nameEn,
    isActive: d.isActive,
    isDefault: d.isDefault,
    categories: d._count.categories,
    products: d._count.products,
  }));

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

      <DepartmentsClient
        key={rows.map((r) => r.id).join()}
        departments={rows}
        nextPosition={nextPosition}
      />
    </div>
  );
}
