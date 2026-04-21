'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export default function ShippingZoneCreateForm({ provinces }: { provinces: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [nameEs, setNameEs] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [baseRate, setBaseRate] = useState('');
  const [perKgRate, setPerKgRate] = useState('');
  const [freeAbove, setFreeAbove] = useState('');
  const [error, setError] = useState('');

  const toggleProvince = (p: string) => {
    setSelected((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));
  };

  const submit = () => {
    setError('');
    const base = Number.parseFloat(baseRate);
    const pkg = Number.parseFloat(perKgRate);
    const free = freeAbove.trim() === '' ? null : Number.parseFloat(freeAbove);
    if (!nameEs.trim() || !nameEn.trim()) {
      setError('Nombre ES y EN son obligatorios.');
      return;
    }
    if (selected.length === 0) {
      setError('Seleccioná al menos una provincia.');
      return;
    }
    if (!Number.isFinite(base) || base < 0 || !Number.isFinite(pkg) || pkg < 0) {
      setError('Tarifa base y por kg deben ser números ≥ 0.');
      return;
    }
    if (free !== null && (!Number.isFinite(free) || free < 0)) {
      setError('Umbral de envío gratis debe ser un número ≥ 0 o vacío.');
      return;
    }

    startTransition(async () => {
      const res = await fetch('/api/admin/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameEs: nameEs.trim(),
          nameEn: nameEn.trim(),
          provinces: selected,
          baseRate: base,
          perKgRate: pkg,
          freeAbove: free,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.message === 'string' ? data.message : 'No se pudo crear la zona');
        return;
      }
      setNameEs('');
      setNameEn('');
      setSelected([]);
      setBaseRate('');
      setPerKgRate('');
      setFreeAbove('');
      router.refresh();
    });
  };

  return (
    <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '1rem' }}>
        Nueva zona de envío
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        <label className="admin-field">
          <span>Nombre (ES) *</span>
          <input className="input" value={nameEs} onChange={(e) => setNameEs(e.target.value)} placeholder="Zona Central" />
        </label>
        <label className="admin-field">
          <span>Nombre (EN) *</span>
          <input className="input" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Central Zone" />
        </label>
        <label className="admin-field" style={{ gridColumn: '1 / -1' }}>
          <span>Provincias *</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.35rem' }}>
            {provinces.map((p) => (
              <label
                key={p}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                <input type="checkbox" checked={selected.includes(p)} onChange={() => toggleProvince(p)} />
                {p}
              </label>
            ))}
          </div>
        </label>
        <label className="admin-field">
          <span>Tarifa base (CRC) *</span>
          <input className="input" type="number" min={0} step={0.01} value={baseRate} onChange={(e) => setBaseRate(e.target.value)} />
        </label>
        <label className="admin-field">
          <span>Por kg (CRC) *</span>
          <input className="input" type="number" min={0} step={0.01} value={perKgRate} onChange={(e) => setPerKgRate(e.target.value)} />
        </label>
        <label className="admin-field">
          <span>Envío gratis desde (CRC, opcional)</span>
          <input
            className="input"
            type="number"
            min={0}
            step={0.01}
            value={freeAbove}
            onChange={(e) => setFreeAbove(e.target.value)}
            placeholder="Vacío = sin umbral"
          />
        </label>
      </div>
      {error && <p style={{ color: 'var(--color-accent)', fontSize: '0.875rem', marginTop: '0.75rem' }}>{error}</p>}
      <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={pending} onClick={submit}>
        {pending ? 'Creando…' : 'Crear zona'}
      </button>
    </div>
  );
}
