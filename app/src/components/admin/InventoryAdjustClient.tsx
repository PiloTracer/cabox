'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

type InvType = 'RESTOCK' | 'ADJUSTMENT' | 'RETURN';

interface ProductOption {
  id: string;
  nameEs: string;
  sku: string;
}

export default function InventoryAdjustClient({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [type, setType] = useState<InvType>('RESTOCK');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    setError('');
    const qty = Number.parseInt(quantity, 10);
    if (!productId) {
      setError('Seleccioná un producto.');
      return;
    }
    if (!Number.isFinite(qty) || qty === 0) {
      setError('La cantidad debe ser un número distinto de cero (positivo suma stock; negativo resta en ajustes).');
      return;
    }

    startTransition(async () => {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity: qty,
          type,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data.message === 'string'
            ? data.message
            : 'No se pudo registrar el movimiento';
        setError(msg);
        return;
      }
      setQuantity('');
      setNote('');
      router.push('/admin/inventory');
    });
  };

  return (
    <div className="admin-card" style={{ maxWidth: '36rem' }}>
      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
        Los movimientos quedan en el libro de inventario (suma de cantidades por producto).{' '}
        <strong>Reposición</strong> y <strong>Devolución</strong> suelen llevar cantidad positiva;{' '}
        <strong>Ajuste</strong> puede ser positivo o negativo para corregir discrepancias.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label className="admin-field">
          <span>Producto *</span>
          <select
            className="input"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">— Seleccionar —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nameEs} ({p.sku})
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          <span>Tipo *</span>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as InvType)}>
            <option value="RESTOCK">Reposición</option>
            <option value="ADJUSTMENT">Ajuste</option>
            <option value="RETURN">Devolución</option>
          </select>
        </label>

        <label className="admin-field">
          <span>Cantidad *</span>
          <input
            type="number"
            className="input"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Ej. 10 o -2"
          />
        </label>

        <label className="admin-field">
          <span>Nota (opcional)</span>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Proveedor, motivo…" />
        </label>
      </div>

      {error && (
        <p style={{ color: 'var(--color-accent)', fontSize: '0.875rem', marginTop: '0.75rem' }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-primary" disabled={pending} onClick={submit}>
          {pending ? 'Guardando…' : 'Registrar movimiento'}
        </button>
        <Link href="/admin/inventory" className="btn btn-secondary">
          Cancelar
        </Link>
      </div>
    </div>
  );
}
