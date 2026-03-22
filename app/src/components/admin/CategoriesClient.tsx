'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  nameEs: string;
  nameEn: string;
  slug: string;
  image?: string | null;
  _count: { products: number };
  children: { id: string; nameEs: string; nameEn: string }[];
}

interface Props {
  categories: Category[];
}

export default function CategoriesClient({ categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ slug: '', nameEn: '', nameEs: '', image: '', parentId: '' });
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState<Record<string, string>>({});

  const handleCreate = () => {
    setError('');
    startTransition(async () => {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, parentId: form.parentId || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Error al crear categoría');
        return;
      }
      setForm({ slug: '', nameEn: '', nameEs: '', image: '', parentId: '' });
      setShowForm(false);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    setDeleteError((prev) => ({ ...prev, [id]: '' }));
    startTransition(async () => {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError((prev) => ({ ...prev, [id]: data.message ?? 'No se puede eliminar' }));
        return;
      }
      router.refresh();
    });
  };

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva Categoría'}
        </button>
      </div>

      {showForm && (
        <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>Nueva Categoría</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-muted)' }}>Nombre (ES)</label>
              <input
                className="input"
                value={form.nameEs}
                onChange={(e) => setForm((f) => ({ ...f, nameEs: e.target.value, slug: autoSlug(e.target.value) }))}
                placeholder="Ropa de Hombre"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-muted)' }}>Nombre (EN)</label>
              <input className="input" value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} placeholder="Men's Clothing" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-muted)' }}>Slug (auto)</label>
              <input className="input" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="ropa-hombre" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-muted)' }}>Categoría Padre</label>
              <select className="input" value={form.parentId} onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}>
                <option value="">— Ninguna (raíz) —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nameEs}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-muted)' }}>URL de Imagen (opcional)</label>
              <input className="input" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          {error && <p style={{ color: 'var(--color-accent)', fontSize: '0.875rem', marginTop: '0.75rem' }}>{error}</p>}
          <button className="btn btn-primary" onClick={handleCreate} disabled={isPending} style={{ marginTop: '1rem' }}>
            {isPending ? 'Creando...' : 'Crear Categoría'}
          </button>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Slug</th>
              <th>Subcategorías</th>
              <th>Productos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  No hay categorías
                </td>
              </tr>
            ) : categories.map((cat) => (
              <tr key={cat.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {cat.image && (
                      <img src={cat.image} alt={cat.nameEs} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '0.375rem', flexShrink: 0 }} />
                    )}
                    <div>
                      <p style={{ fontWeight: 600 }}>{cat.nameEs}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{cat.nameEn}</p>
                    </div>
                  </div>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{cat.slug}</td>
                <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{cat.children.length}</td>
                <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{cat._count.products}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={isPending || cat._count.products > 0 || cat.children.length > 0}
                      className="btn btn-sm"
                      style={{ color: 'var(--color-accent)', border: '1px solid var(--color-accent)', background: 'transparent', opacity: (cat._count.products > 0 || cat.children.length > 0) ? 0.4 : 1 }}
                      title={cat._count.products > 0 ? 'Tiene productos, no se puede eliminar' : cat.children.length > 0 ? 'Tiene subcategorías' : 'Eliminar'}
                    >
                      Eliminar
                    </button>
                    {deleteError[cat.id] && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>{deleteError[cat.id]}</p>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
