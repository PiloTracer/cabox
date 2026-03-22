import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Clientes — Cabox Admin' };

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminCustomersPage({ searchParams }: Props) {
  const { q, page: pageStr } = await searchParams;
  const page = parseInt(pageStr ?? '1', 10);
  const PAGE_SIZE = 30;

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { email: { contains: q, mode: 'insensitive' as const } },
          { phone: { contains: q } },
        ],
      }
    : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.customer.count({ where }),
  ]);

  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Clientes ({total})</h1>
      </div>

      <form method="get" style={{ marginBottom: '1rem' }}>
        <input
          name="q"
          defaultValue={q}
          className="input"
          placeholder="Buscar por nombre, email o teléfono…"
          style={{ maxWidth: '400px' }}
        />
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Pedidos</th>
              <th>Registro</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Sin clientes</td></tr>
            ) : customers.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 500 }}>{c.name}</td>
                <td>
                  <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                    style={{ color: 'var(--color-primary)', fontSize: '0.875rem' }}>
                    {c.phone}
                  </a>
                </td>
                <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{c.email ?? '—'}</td>
                <td>
                  <Link href={`/admin/orders?customerId=${c.id}`} style={{ fontWeight: 600 }}>
                    {c._count.orders}
                  </Link>
                </td>
                <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                  {formatDate(c.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/admin/customers?${q ? `q=${q}&` : ''}page=${p}`}
              className={`filter-chip ${p === page ? 'active' : ''}`}>{p}</Link>
          ))}
        </div>
      )}
    </div>
  );
}
