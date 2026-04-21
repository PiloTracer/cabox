import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import ShippingZoneCreateForm from '@/components/admin/ShippingZoneCreateForm';
import ShippingZoneCard from '@/components/admin/ShippingZoneCard';

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

      <ShippingZoneCreateForm provinces={CR_PROVINCES} />

      {zones.length === 0 && (
        <div className="admin-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
          No hay zonas guardadas todavía. Usá el formulario de arriba para crear la primera.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {zones.map((zone) => (
          <ShippingZoneCard
            key={zone.id}
            allProvinces={CR_PROVINCES}
            zone={{
              id: zone.id,
              nameEs: zone.nameEs,
              nameEn: zone.nameEn,
              provinces: zone.provinces,
              baseRate: Number(zone.baseRate),
              perKgRate: Number(zone.perKgRate),
              freeAbove: zone.freeAbove != null ? Number(zone.freeAbove) : null,
            }}
          />
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
