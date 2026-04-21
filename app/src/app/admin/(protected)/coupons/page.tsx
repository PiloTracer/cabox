import type { Coupon } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { formatCRC, formatDate } from '@/lib/format';
import { CreateCouponBtn } from '@/components/admin/CreateCouponBtn';
import CouponActiveToggle from '@/components/admin/CouponActiveToggle';
import EditCouponBtn from '@/components/admin/EditCouponBtn';
import type { CouponFormInitial } from '@/components/admin/coupon-types';

function toCouponFormInitial(c: Coupon): CouponFormInitial {
  return {
    id: c.id,
    code: c.code,
    descriptionEs: c.descriptionEs,
    descriptionEn: c.descriptionEn,
    type: c.type,
    discountValue: Number(c.discountValue),
    minOrderAmount: c.minOrderAmount != null ? Number(c.minOrderAmount) : null,
    maxDiscount: c.maxDiscount != null ? Number(c.maxDiscount) : null,
    maxUses: c.maxUses,
    maxUsesPerCustomer: c.maxUsesPerCustomer,
    startsAt: c.startsAt.toISOString(),
    expiresAt: c.expiresAt.toISOString(),
    isActive: c.isActive,
  };
}

export const metadata: Metadata = { title: 'Cupones — Cabox Admin' };

const TYPE_LABEL: Record<string, string> = {
  PERCENTAGE: 'Porcentaje', FIXED_AMOUNT: 'Monto Fijo', FREE_SHIPPING: 'Envío Gratis',
};

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  const now = new Date();

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Cupones</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {coupons.filter((c) => c.isActive && new Date(c.expiresAt) > now).length} cupones activos
          </p>
        </div>
        <CreateCouponBtn />
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Tipo</th>
              <th>Descuento</th>
              <th>Usos</th>
              <th>Expira</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                Sin cupones. Usa el botón «+ Nuevo Cupón» para crear el primero.
              </td></tr>
            ) : coupons.map((c) => {
              const expired = new Date(c.expiresAt) < now;
              const exhausted = c.maxUses !== null && c.usedCount >= c.maxUses;
              const active = c.isActive && !expired && !exhausted;
              return (
                <tr key={c.id}>
                  <td>
                    <code style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.05em' }}>{c.code}</code>
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{TYPE_LABEL[c.type] ?? c.type}</td>
                  <td style={{ fontWeight: 600 }}>
                    {c.type === 'PERCENTAGE' ? `${Number(c.discountValue)}%` :
                     c.type === 'FREE_SHIPPING' ? '—' :
                     formatCRC(Number(c.discountValue))}
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>
                    {c.usedCount}{c.maxUses !== null ? ` / ${c.maxUses}` : ' / ∞'}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: expired ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                    {formatDate(c.expiresAt)}
                  </td>
                  <td>
                    <span className={`badge badge-${active ? 'success' : exhausted ? 'warning' : 'muted'}`}>
                      {active ? 'Activo' : exhausted ? 'Agotado' : expired ? 'Expirado' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                      <EditCouponBtn initial={toCouponFormInitial(c)} />
                      <CouponActiveToggle id={c.id} isActive={c.isActive} />
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
