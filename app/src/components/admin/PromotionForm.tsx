'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PROMO_TYPES = [
  { value: 'PERCENTAGE', label: 'Porcentaje' },
  { value: 'FIXED_AMOUNT', label: 'Monto Fijo' },
  { value: 'BUY_X_GET_Y', label: '2×1' },
  { value: 'FREE_SHIPPING', label: 'Envío Gratis' },
];

const SCOPES = [
  { value: 'ALL', label: 'Todos los productos' },
  { value: 'CATEGORY', label: 'Categoría específica' },
  { value: 'PRODUCT', label: 'Producto específico' },
];

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
}

export default function PromotionForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const body = {
      nameEs: fd.get('nameEs') as string,
      nameEn: fd.get('nameEn') as string,
      slug: fd.get('slug') as string,
      type: fd.get('type') as string,
      discountValue: Number(fd.get('discountValue')),
      minOrderAmount: fd.get('minOrderAmount') ? Number(fd.get('minOrderAmount')) : null,
      maxDiscount: fd.get('maxDiscount') ? Number(fd.get('maxDiscount')) : null,
      applicableTo: fd.get('applicableTo') as string,
      startsAt: new Date(fd.get('startsAt') as string).toISOString(),
      endsAt: new Date(fd.get('endsAt') as string).toISOString(),
      isActive: fd.get('isActive') === 'on',
      priority: Number(fd.get('priority') || 0),
      stackable: fd.get('stackable') === 'on',
    };

    const res = await fetch('/api/admin/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message || 'Error al crear la promoción');
      setSaving(false);
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="admin-form-modal-backdrop" onClick={onClose}>
      <div className="admin-form-modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.5rem' }}>Nueva Promoción</h2>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label className="admin-field">
              <span>Nombre (ES) *</span>
              <input name="nameEs" required className="input"
                onChange={(e) => {
                  const slugInput = e.currentTarget.form?.querySelector<HTMLInputElement>('[name=slug]');
                  if (slugInput) slugInput.value = slugify(e.target.value);
                }}
              />
            </label>
            <label className="admin-field">
              <span>Nombre (EN) *</span>
              <input name="nameEn" required className="input" />
            </label>
          </div>

          <label className="admin-field">
            <span>Slug *</span>
            <input name="slug" required className="input" pattern="[a-z0-9\-]+" title="solo letras minúsculas, números y guiones" />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label className="admin-field">
              <span>Tipo *</span>
              <select name="type" required className="input">
                {PROMO_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            <label className="admin-field">
              <span>Valor descuento *</span>
              <input name="discountValue" type="number" step="0.01" min="0" required className="input" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label className="admin-field">
              <span>Monto mínimo orden</span>
              <input name="minOrderAmount" type="number" step="0.01" min="0" className="input" placeholder="Opcional" />
            </label>
            <label className="admin-field">
              <span>Descuento máximo</span>
              <input name="maxDiscount" type="number" step="0.01" min="0" className="input" placeholder="Opcional" />
            </label>
          </div>

          <label className="admin-field">
            <span>Aplicable a</span>
            <select name="applicableTo" className="input">
              {SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label className="admin-field">
              <span>Inicia *</span>
              <input name="startsAt" type="datetime-local" required className="input" />
            </label>
            <label className="admin-field">
              <span>Termina *</span>
              <input name="endsAt" type="datetime-local" required className="input" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <label className="admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
              <input name="isActive" type="checkbox" defaultChecked />
              <span>Activa</span>
            </label>
            <label className="admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
              <input name="stackable" type="checkbox" />
              <span>Acumulable</span>
            </label>
            <label className="admin-field">
              <span>Prioridad</span>
              <input name="priority" type="number" min="0" defaultValue="0" className="input" style={{ width: '5rem' }} />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Crear Promoción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
