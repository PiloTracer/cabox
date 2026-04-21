'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { formatCRC } from '@/lib/format';

export type ShippingZoneView = {
  id: string;
  nameEs: string;
  nameEn: string;
  provinces: string[];
  baseRate: number;
  perKgRate: number;
  freeAbove: number | null;
};

export default function ShippingZoneCard({
  zone,
  allProvinces,
}: {
  zone: ShippingZoneView;
  allProvinces: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const submitEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const selected = allProvinces.filter((p) => fd.get(`prov_${p}`) === 'on');
    const baseRate = Number.parseFloat(fd.get('baseRate') as string);
    const perKgRate = Number.parseFloat(fd.get('perKgRate') as string);
    const faRaw = (fd.get('freeAbove') as string)?.trim();
    const freeAbove = faRaw === '' ? null : Number.parseFloat(faRaw);

    startTransition(async () => {
      const res = await fetch(`/api/admin/shipping/${zone.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameEs: (fd.get('nameEs') as string).trim(),
          nameEn: (fd.get('nameEn') as string).trim(),
          provinces: selected,
          baseRate,
          perKgRate,
          freeAbove,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.message === 'string' ? data.message : 'No se pudo guardar');
        return;
      }
      setEditing(false);
      router.refresh();
    });
  };

  const confirmDelete = () => {
    setError('');
    startTransition(async () => {
      const res = await fetch(`/api/admin/shipping/${zone.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.message === 'string' ? data.message : 'No se pudo eliminar');
        return;
      }
      setDeleting(false);
      router.refresh();
    });
  };

  return (
    <div className="admin-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '0.5rem' }}>
            {zone.nameEs}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            {zone.nameEn}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
            Editar
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
            onClick={() => setDeleting(true)}
          >
            Eliminar
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
        {zone.provinces.map((p) => (
          <span key={p} className="badge badge-muted" style={{ fontSize: '0.75rem' }}>
            {p}
          </span>
        ))}
      </div>
      <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Tarifa base</span>
          <span style={{ fontWeight: 600 }}>{formatCRC(zone.baseRate)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Por kg</span>
          <span style={{ fontWeight: 600 }}>{formatCRC(zone.perKgRate)}</span>
        </div>
        {zone.freeAbove != null && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Gratis sobre</span>
            <span style={{ fontWeight: 600, color: 'green' }}>{formatCRC(zone.freeAbove)}</span>
          </div>
        )}
      </div>

      {editing && (
        <div className="admin-form-modal-backdrop" onClick={() => !pending && setEditing(false)}>
          <div className="admin-form-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '28rem' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>Editar zona</h4>
            <form onSubmit={submitEdit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label className="admin-field">
                <span>Nombre (ES)</span>
                <input name="nameEs" className="input" required defaultValue={zone.nameEs} />
              </label>
              <label className="admin-field">
                <span>Nombre (EN)</span>
                <input name="nameEn" className="input" required defaultValue={zone.nameEn} />
              </label>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Provincias</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.35rem' }}>
                  {allProvinces.map((p) => (
                    <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                      <input type="checkbox" name={`prov_${p}`} defaultChecked={zone.provinces.includes(p)} />
                      {p}
                    </label>
                  ))}
                </div>
              </div>
              <label className="admin-field">
                <span>Tarifa base (CRC)</span>
                <input name="baseRate" type="number" min={0} step={0.01} required className="input" defaultValue={zone.baseRate} />
              </label>
              <label className="admin-field">
                <span>Por kg (CRC)</span>
                <input name="perKgRate" type="number" min={0} step={0.01} required className="input" defaultValue={zone.perKgRate} />
              </label>
              <label className="admin-field">
                <span>Envío gratis desde (opcional)</span>
                <input
                  name="freeAbove"
                  type="number"
                  min={0}
                  step={0.01}
                  className="input"
                  defaultValue={zone.freeAbove ?? ''}
                  placeholder="Vacío = sin umbral"
                />
              </label>
              {error && <p style={{ color: 'var(--color-accent)', fontSize: '0.85rem' }}>{error}</p>}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" disabled={pending} onClick={() => setEditing(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleting && (
        <div className="admin-form-modal-backdrop" onClick={() => !pending && setDeleting(false)}>
          <div className="admin-form-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '24rem' }}>
            <p style={{ marginBottom: '1rem', lineHeight: 1.5 }}>
              ¿Eliminar la zona <strong>{zone.nameEs}</strong>? Esta acción no se puede deshacer.
            </p>
            {error && <p style={{ color: 'var(--color-accent)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" disabled={pending} onClick={() => setDeleting(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" disabled={pending} onClick={confirmDelete}>
                {pending ? '…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
