'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export interface DepartmentRow {
  id: string;
  slug: string;
  nameEs: string;
  nameEn: string;
  isActive: boolean;
  isDefault: boolean;
  categories: number;
  products: number;
}

interface Props {
  departments: DepartmentRow[];
  nextPosition: number;
}

export default function DepartmentsClient({ departments, nextPosition }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    slug: '',
    nameEn: '',
    nameEs: '',
    taglineEn: '',
    taglineEs: '',
    isActive: true,
    position: nextPosition,
  });
  const [error, setError] = useState('');
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [confirmDeactivate, setConfirmDeactivate] = useState<DepartmentRow | null>(null);
  const [modalError, setModalError] = useState('');

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleCreate = () => {
    setError('');
    startTransition(async () => {
      const slug = form.slug.trim().toLowerCase();
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          nameEn: form.nameEn.trim(),
          nameEs: form.nameEs.trim(),
          taglineEn: form.taglineEn.trim(),
          taglineEs: form.taglineEs.trim(),
          isActive: form.isActive,
          position: Number.isFinite(form.position) ? Math.floor(form.position) : nextPosition,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const fieldErrors = data.errors?.fieldErrors as Record<string, string[] | undefined> | undefined;
        const firstZod =
          fieldErrors &&
          Object.values(fieldErrors)
            .flat()
            .find((m): m is string => typeof m === 'string' && m.length > 0);
        const msg =
          typeof data.message === 'string'
            ? data.message
            : firstZod ?? 'No se pudo crear el departamento';
        setError(msg);
        return;
      }
      setForm({
        slug: '',
        nameEn: '',
        nameEs: '',
        taglineEn: '',
        taglineEs: '',
        isActive: true,
        position: nextPosition,
      });
      setShowForm(false);
      router.refresh();
    });
  };

  const closeModal = () => {
    setConfirmDeactivate(null);
    setModalError('');
  };

  const handleConfirmDeactivate = () => {
    const d = confirmDeactivate;
    if (!d) return;
    setModalError('');
    setRowError((r) => ({ ...r, [d.id]: '' }));
    startTransition(async () => {
      const res = await fetch(`/api/admin/departments/${d.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof data.message === 'string' ? data.message : 'No se pudo desactivar';
        setModalError(msg);
        setRowError((r) => ({ ...r, [d.id]: msg }));
        return;
      }
      closeModal();
      router.refresh();
    });
  };

  const handleActivate = (d: DepartmentRow) => {
    setRowError((r) => ({ ...r, [d.id]: '' }));
    startTransition(async () => {
      const res = await fetch(`/api/admin/departments/${d.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof data.message === 'string' ? data.message : 'No se pudo activar';
        setRowError((r) => ({ ...r, [d.id]: msg }));
        return;
      }
      router.refresh();
    });
  };

  const canDeactivate = (d: DepartmentRow) =>
    d.slug !== 'general' && d.isActive;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo departamento'}
        </button>
      </div>

      {showForm && (
        <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>Nuevo departamento</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            El slug define la URL pública (<code>/es/[slug]</code>). Solo letras minúsculas, números y guiones;
            no uses palabras reservadas (<code>api</code>, <code>checkout</code>, etc.).
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  marginBottom: '0.3rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                Nombre (ES)
              </label>
              <input
                className="input"
                value={form.nameEs}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    nameEs: e.target.value,
                    slug: autoSlug(e.target.value),
                  }))
                }
                placeholder="Ej. Calzado"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  marginBottom: '0.3rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                Nombre (EN)
              </label>
              <input
                className="input"
                value={form.nameEn}
                onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                placeholder="Footwear"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  marginBottom: '0.3rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                Slug (URL)
              </label>
              <input
                className="input"
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                  }))
                }
                placeholder="calzado"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  marginBottom: '0.3rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                Tagline (ES, opcional)
              </label>
              <input
                className="input"
                value={form.taglineEs}
                onChange={(e) => setForm((f) => ({ ...f, taglineEs: e.target.value }))}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  marginBottom: '0.3rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                Tagline (EN, opcional)
              </label>
              <input
                className="input"
                value={form.taglineEn}
                onChange={(e) => setForm((f) => ({ ...f, taglineEn: e.target.value }))}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  marginBottom: '0.3rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                Orden (posición)
              </label>
              <input
                type="number"
                className="input"
                min={0}
                value={form.position}
                onChange={(e) =>
                  setForm((f) => ({ ...f, position: Number.parseInt(e.target.value, 10) || 0 }))
                }
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                <span style={{ fontSize: '0.875rem' }}>Activo en tienda</span>
              </label>
            </div>
          </div>
          {error && (
            <p style={{ color: 'var(--color-accent)', fontSize: '0.875rem', marginTop: '0.75rem' }}>
              {error}
            </p>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={isPending || !form.slug.trim() || !form.nameEn.trim() || !form.nameEs.trim()}
            style={{ marginTop: '1rem' }}
          >
            {isPending ? 'Creando…' : 'Crear departamento'}
          </button>
        </div>
      )}

      {confirmDeactivate && (
        <div className="admin-form-modal-backdrop" role="presentation" onClick={closeModal}>
          <div
            className="admin-form-modal"
            role="dialog"
            aria-labelledby="deactivate-dept-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '26rem' }}
          >
            <h2 id="deactivate-dept-title" style={{ fontFamily: 'var(--font-display)', marginBottom: '0.75rem' }}>
              ¿Desactivar departamento?
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              <strong>{confirmDeactivate.nameEs}</strong> dejará de mostrarse en la navegación de la tienda y en las
              rutas públicas como departamento disponible. Podrás reactivarlo cuando quieras.
            </p>
            {modalError && (
              <p style={{ color: 'var(--color-accent)', fontSize: '0.875rem', marginTop: '0.75rem' }}>
                {modalError}
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleConfirmDeactivate} disabled={isPending}>
                {isPending ? 'Desactivando…' : 'Sí, desactivar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Slug</th>
              <th>Estado</th>
              <th>Cat.</th>
              <th>Prod.</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{d.nameEs}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{d.nameEn}</div>
                  {d.isDefault && (
                    <span className="badge badge-success" style={{ marginTop: '0.35rem' }}>
                      Por defecto
                    </span>
                  )}
                </td>
                <td>
                  <code style={{ fontSize: '0.85rem' }}>{d.slug}</code>
                </td>
                <td>
                  <span className={`badge badge-${d.isActive ? 'success' : 'muted'}`}>
                    {d.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>{d.categories}</td>
                <td>{d.products}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                    <Link
                      href={`/es/${d.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      Ver tienda
                    </Link>
                    {canDeactivate(d) && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
                        onClick={() => setConfirmDeactivate(d)}
                      >
                        Desactivar
                      </button>
                    )}
                    {!d.isActive && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleActivate(d)}
                        disabled={isPending}
                      >
                        Activar
                      </button>
                    )}
                    {d.slug === 'general' && d.isActive && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }} title="El departamento General no puede desactivarse">
                        —
                      </span>
                    )}
                  </div>
                  {rowError[d.id] && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', marginTop: '0.35rem' }}>
                      {rowError[d.id]}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
