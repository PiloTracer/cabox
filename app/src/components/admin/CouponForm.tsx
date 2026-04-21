'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toDatetimeLocalInputValue } from '@/lib/format';
import type { CouponFormInitial } from './coupon-types';

const COUPON_TYPES = [
  { value: 'PERCENTAGE', label: 'Porcentaje' },
  { value: 'FIXED_AMOUNT', label: 'Monto Fijo' },
  { value: 'FREE_SHIPPING', label: 'Envío Gratis' },
];

export default function CouponForm({
  onClose,
  initial = null,
}: {
  onClose: () => void;
  initial?: CouponFormInitial | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = Boolean(initial);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const payload = {
      code: (fd.get('code') as string).toUpperCase().trim(),
      descriptionEs: (fd.get('descriptionEs') as string) || undefined,
      descriptionEn: (fd.get('descriptionEn') as string) || undefined,
      type: fd.get('type') as string,
      discountValue: Number(fd.get('discountValue')),
      minOrderAmount: fd.get('minOrderAmount') ? Number(fd.get('minOrderAmount')) : null,
      maxDiscount: fd.get('maxDiscount') ? Number(fd.get('maxDiscount')) : null,
      maxUses: fd.get('maxUses') ? Number(fd.get('maxUses')) : null,
      maxUsesPerCustomer: fd.get('maxUsesPerCustomer')
        ? Number(fd.get('maxUsesPerCustomer'))
        : null,
      startsAt: new Date(fd.get('startsAt') as string).toISOString(),
      expiresAt: new Date(fd.get('expiresAt') as string).toISOString(),
      isActive: fd.get('isActive') === 'on',
    };

    const url = isEdit ? `/api/admin/coupons/${initial!.id}` : '/api/admin/coupons';
    const res = await fetch(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.message === 'string' ? data.message : 'Error al guardar el cupón');
      setSaving(false);
      return;
    }

    router.refresh();
    onClose();
  }

  const t0 = initial ? toDatetimeLocalInputValue(initial.startsAt) : '';
  const t1 = initial ? toDatetimeLocalInputValue(initial.expiresAt) : '';

  return (
    <div className="admin-form-modal-backdrop" onClick={onClose}>
      <div className="admin-form-modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.5rem' }}>
          {isEdit ? 'Editar cupón' : 'Nuevo Cupón'}
        </h2>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form
          key={initial?.id ?? 'create'}
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label className="admin-field">
              <span>Código *</span>
              <input
                name="code"
                required
                className="input"
                minLength={3}
                maxLength={20}
                placeholder="Ej: VERANO25"
                style={{ textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '0.1em' }}
                defaultValue={initial?.code}
              />
            </label>
            <label className="admin-field">
              <span>Tipo *</span>
              <select name="type" required className="input" defaultValue={initial?.type ?? 'PERCENTAGE'}>
                {COUPON_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label className="admin-field">
              <span>Descripción (ES)</span>
              <input name="descriptionEs" className="input" placeholder="Opcional" defaultValue={initial?.descriptionEs ?? ''} />
            </label>
            <label className="admin-field">
              <span>Descripción (EN)</span>
              <input name="descriptionEn" className="input" placeholder="Opcional" defaultValue={initial?.descriptionEn ?? ''} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <label className="admin-field">
              <span>Valor descuento *</span>
              <input
                name="discountValue"
                type="number"
                step="0.01"
                min="0"
                required
                className="input"
                defaultValue={initial != null ? initial.discountValue : undefined}
              />
            </label>
            <label className="admin-field">
              <span>Monto mínimo</span>
              <input
                name="minOrderAmount"
                type="number"
                step="0.01"
                min="0"
                className="input"
                placeholder="Opcional"
                defaultValue={initial?.minOrderAmount ?? undefined}
              />
            </label>
            <label className="admin-field">
              <span>Desc. máximo</span>
              <input
                name="maxDiscount"
                type="number"
                step="0.01"
                min="0"
                className="input"
                placeholder="Opcional"
                defaultValue={initial?.maxDiscount ?? undefined}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label className="admin-field">
              <span>Usos máximos</span>
              <input
                name="maxUses"
                type="number"
                min="1"
                className="input"
                placeholder="∞ si vacío"
                defaultValue={initial?.maxUses ?? undefined}
              />
            </label>
            <label className="admin-field">
              <span>Usos por cliente</span>
              <input
                name="maxUsesPerCustomer"
                type="number"
                min="1"
                className="input"
                defaultValue={initial?.maxUsesPerCustomer ?? 1}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label className="admin-field">
              <span>Inicia *</span>
              <input name="startsAt" type="datetime-local" required className="input" defaultValue={t0} />
            </label>
            <label className="admin-field">
              <span>Expira *</span>
              <input name="expiresAt" type="datetime-local" required className="input" defaultValue={t1} />
            </label>
          </div>

          <label className="admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <input name="isActive" type="checkbox" defaultChecked={initial?.isActive ?? true} />
            <span>Activo</span>
          </label>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear Cupón'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
