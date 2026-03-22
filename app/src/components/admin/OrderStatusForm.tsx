'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const PAY_STATUSES = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];

interface Props {
  orderId: string;
  currentStatus: string;
  currentPaymentStatus: string;
  currentNotes: string;
}

export default function OrderStatusForm({ orderId, currentStatus, currentPaymentStatus, currentNotes }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);
  const [paymentStatus, setPaymentStatus] = useState(currentPaymentStatus);
  const [notes, setNotes] = useState(currentNotes);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setError('');
    setSaved(false);
    startTransition(async () => {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, paymentStatus, notes }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? 'Error al guardar');
        return;
      }
      setSaved(true);
      router.refresh();
    });
  };

  return (
    <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '0.5rem' }}>
        Actualizar Estado
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-text-muted)' }}>
            Estado del Pedido
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'white', fontSize: '0.9rem' }}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-text-muted)' }}>
            Estado de Pago
          </label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'white', fontSize: '0.9rem' }}
          >
            {PAY_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-text-muted)' }}>
          Notas Internas
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'white', fontSize: '0.9rem', resize: 'vertical' }}
          placeholder="Notas visibles solo para el administrador..."
        />
      </div>

      {error && (
        <p style={{ color: 'var(--color-accent)', fontSize: '0.875rem' }}>{error}</p>
      )}
      {saved && (
        <p style={{ color: 'green', fontSize: '0.875rem' }}>✓ Guardado correctamente</p>
      )}

      <button
        onClick={handleSave}
        disabled={isPending}
        className="btn btn-primary"
        style={{ alignSelf: 'flex-start' }}
      >
        {isPending ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </div>
  );
}
