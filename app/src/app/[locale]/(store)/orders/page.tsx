import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Buscar pedido — Cabox' };

interface Props { searchParams: Promise<{ q?: string }> }

export default async function OrderLookupPage({ searchParams }: Props) {
  const locale = await getLocale();
  const { q } = await searchParams;

  // Redirect immediately when the user submits the form
  if (q?.trim()) redirect(`/${locale}/orders/${encodeURIComponent(q.trim())}`);

  return (
    <div className="container" style={{ paddingBlock: '3rem', maxWidth: 520 }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📦</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>
          Seguir mi pedido
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
          Ingresa el número de pedido que recibiste en tu correo de confirmación.
        </p>
      </div>

      <div className="card card-body" style={{ padding: '2rem' }}>
        <form action={`/${locale}/orders`} method="GET" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="orderNumber">
              Número de pedido
            </label>
            <input
              id="orderNumber"
              name="q"
              className="input"
              placeholder="ej. CB-20240322-ABCD"
              required
              autoComplete="off"
              style={{ fontSize: '1.05rem', letterSpacing: '0.03em' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Buscar pedido
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem', padding: '1rem',
          background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)',
          fontSize: '0.875rem', color: 'var(--color-text-muted)',
        }}>
          <strong>¿No tienes el número?</strong> Revisa el correo que te enviamos al confirmar tu compra.
          Si necesitas ayuda, contáctanos por WhatsApp.
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <Link href={`/${locale}/products`} className="btn btn-ghost" style={{ fontSize: '0.9rem' }}>
          ← Seguir comprando
        </Link>
      </div>
    </div>
  );
}
