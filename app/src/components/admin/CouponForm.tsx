'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const COUPON_TYPES = [
  { value: 'PERCENTAGE', label: 'Porcentaje' },
  { value: 'FIXED_AMOUNT', label: 'Monto Fijo' },
  { value: 'FREE_SHIPPING', label: 'Envío Gratis' },
];

export default function CouponForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const body = {
      code: (fd.get('code') as string).toUpperCase(),
      descriptionEs: fd.get('descriptionEs') as string || undefined,
      descriptionEn: fd.get('descriptionEn') as string || undefined,
      type: fd.get('type') as string,
      discountValue: Number(fd.get('discountValue')),
      minOrderAmount: fd.get('minOrderAmount') ? Number(fd.get('minOrderAmount')) : null,
      maxDiscount: fd.get('maxDiscount') ? Number(fd.get('maxDiscount')) : null,
      maxUses: fd.get('maxUses') ? Number(fd.get('maxUses')) : null,
      maxUsesPerCustomer: fd.get('maxUsesPerCustomer') ? Number(fd.get('maxUsesPerCustomer')) : null,
      startsAt: new Date(fd.get('startsAt') as string).toISOString(),
      expiresAt: new Date(fd.get('expiresAt') as string).toISOString(),
      isActive: fd.get('isActive') === 'on',
    };

    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message || 'Error al crear el cupón');
      setSaving(false);
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="admin-form-modal-backdrop" onClick={onClose}>
      <div className="admin-form-modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.5rem' }}>Nuevo Cupón</h2>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label className="admin-field">
              <span>Código *</span>
              <input name="code" required className="input" minLength={3} maxLength={20}
                placeholder="Ej: VERANO25"
                style={{ textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '0.1em' }}
              />
            </label>
            <label className="admin-field">
              <span>Tipo *</span>
              <select name="type" required className="input">
                {COUPON_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label className="admin-field">
              <span>Descripción (ES)</span>
              <input name="descriptionEs" className="input" placeholder="Opcional" />
            </label>
            <label className="admin-field">
              <span>Descripción (EN)</span>
              <input name="descriptionEn" className="input" placeholder="Opcional" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <label className="admin-field">
              <span>Valor descuento *</span>
              <input name="discountValue" type="number" step="0.01" min="0" required className="input" />
            </label>
            <label className="admin-field">
              <span>Monto mínimo</span>
              <input name="minOrderAmount" type="number" step="0.01" min="0" className="input" placeholder="Opcional" />
            </label>
            <label className="admin-field">
              <span>Desc. máximo</span>
              <input name="maxDiscount" type="number" step="0.01" min="0" className="input" placeholder="Opcional" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label className="admin-field">
              <span>Usos máximos</span>
              <input name="maxUses" type="number" min="1" className="input" placeholder="∞ si vacío" />
            </label>
            <label className="admin-field">
              <span>Usos por cliente</span>
              <input name="maxUsesPerCustomer" type="number" min="1" className="input" defaultValue="1" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label className="admin-field">
              <span>Inicia *</span>
              <input name="startsAt" type="datetime-local" required className="input" />
            </label>
            <label className="admin-field">
              <span>Expira *</span>
              <input name="expiresAt" type="datetime-local" required className="input" />
            </label>
          </div>

          <label className="admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <input name="isActive" type="checkbox" defaultChecked />
            <span>Activo</span>
          </label>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Crear Cupón'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
