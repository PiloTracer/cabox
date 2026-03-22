import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { formatCRC } from '@/lib/format';

export const metadata: Metadata = { title: 'Envíos — Cabox Admin' };

const CR_PROVINCES = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];

export default async function AdminShippingPage() {
  const zones = await prisma.shippingZone.findMany({ orderBy: { nameEs: 'asc' } });

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Zonas de Envío</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          Configura tarifas por provincia de Costa Rica
        </p>
      </div>

      {zones.length === 0 && (
        <div className="admin-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          No hay zonas configuradas. Las zonas se crean via la API <code>/api/admin/shipping</code>.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {zones.map((zone) => (
          <div key={zone.id} className="admin-card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '0.5rem' }}>
              {zone.nameEs}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>{zone.nameEn}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
              {zone.provinces.map((p) => (
                <span key={p} className="badge badge-muted" style={{ fontSize: '0.75rem' }}>{p}</span>
              ))}
            </div>
            <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Tarifa base</span>
                <span style={{ fontWeight: 600 }}>{formatCRC(Number(zone.baseRate))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Por kg</span>
                <span style={{ fontWeight: 600 }}>{formatCRC(Number(zone.perKgRate))}</span>
              </div>
              {zone.freeAbove && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Gratis sobre</span>
                  <span style={{ fontWeight: 600, color: 'green' }}>{formatCRC(Number(zone.freeAbove))}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <details style={{ marginTop: '2rem' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '1rem' }}>
          Provincias de Costa Rica ({CR_PROVINCES.length})
        </summary>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {CR_PROVINCES.map((p) => (
            <span key={p} className="badge badge-muted">{p}</span>
          ))}
        </div>
      </details>
    </div>
  );
}
