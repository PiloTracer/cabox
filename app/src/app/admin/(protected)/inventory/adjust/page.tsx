import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import InventoryAdjustClient from '@/components/admin/InventoryAdjustClient';

export const metadata: Metadata = { title: 'Ajustar inventario — Cabox Admin' };

export default async function InventoryAdjustPage() {
  const products = await prisma.product.findMany({
    where: { status: { not: 'ARCHIVED' } },
    select: { id: true, nameEs: true, sku: true },
    orderBy: { nameEs: 'asc' },
  });

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <Link href="/admin/inventory" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            ← Inventario
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginTop: '0.5rem' }}>
            Ajustar stock
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Registra reposiciones, devoluciones o ajustes de inventario.
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
          No hay productos disponibles. Creá productos primero en{' '}
          <Link href="/admin/products/new" style={{ color: 'var(--color-primary)' }}>
            Nuevo producto
          </Link>
          .
        </div>
      ) : (
        <InventoryAdjustClient products={products} />
      )}
    </div>
  );
}
