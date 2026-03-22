import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { formatCRC, formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Promociones — Cabox Admin' };

const TYPE_LABEL: Record<string, string> = {
  PERCENTAGE: 'Porcentaje', FIXED_AMOUNT: 'Monto Fijo',
  BUY_X_GET_Y: '2×1', FREE_SHIPPING: 'Envío Gratis',
};

export default async function AdminPromotionsPage() {
  const promotions = await prisma.promotion.findMany({ orderBy: { startsAt: 'desc' } });
  const now = new Date();


  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Promociones</h1>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Descuento</th>
              <th>Vigencia</th>
              <th>Prioridad</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {promotions.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                Sin promociones. Créalas via la API POST /api/admin/promotions
              </td></tr>
            ) : promotions.map((p) => {
              const active = p.isActive && new Date(p.startsAt) <= now && new Date(p.endsAt) >= now;
              return (
                <tr key={p.id}>
                  <td>
                    <div>
                      <p style={{ fontWeight: 600 }}>{p.nameEs}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{p.slug}</p>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{TYPE_LABEL[p.type] ?? p.type}</td>
                  <td style={{ fontWeight: 700 }}>
                    {p.type === 'PERCENTAGE' ? `${Number(p.discountValue)}%` :
                     p.type === 'FREE_SHIPPING' ? '—' :
                     formatCRC(p.discountValue)}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {formatDate(p.startsAt)} — {formatDate(p.endsAt)}
                  </td>
                  <td style={{ textAlign: 'center' }}>{p.priority}</td>
                  <td>
                    <span className={`badge badge-${active ? 'success' : 'muted'}`}>
                      {active ? 'Activa' : p.isActive && new Date(p.endsAt) < now ? 'Expirada' : 'Inactiva'}
                    </span>
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
