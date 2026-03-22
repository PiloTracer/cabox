import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import CategoriesClient from '@/components/admin/CategoriesClient';

export const metadata: Metadata = { title: 'Categorías — Cabox Admin' };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: { select: { id: true, nameEs: true, nameEn: true } },
      _count: { select: { products: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>
          Categorías
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          Organiza los productos en categorías. Las categorías con productos no se pueden eliminar.
        </p>
      </div>

      <CategoriesClient categories={categories} />
    </div>
  );
}
