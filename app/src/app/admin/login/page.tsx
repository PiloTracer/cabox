'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);

    const res = await signIn('credentials', {
      email: fd.get('email'),
      password: fd.get('password'),
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError('Credenciales inválidas. Verifica tu email y contraseña.');
    } else {
      router.push('/admin');
      router.refresh();
    }
  };

  return (
    <div className="login-page">
      <div className="card login-card">
        <div className="login-logo">Cabox</div>
        <p className="login-subtitle">Panel de administración</p>

        {error && (
          <div
            style={{
              background: '#fee2e2', color: 'var(--color-error)',
              border: '1px solid #fca5a5', borderRadius: 'var(--radius-lg)',
              padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.375rem', fontSize: '0.9rem' }}>
              Email
            </label>
            <input
              className="input"
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="admin@tutienda.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.375rem', fontSize: '0.9rem' }}>
              Contraseña
            </label>
            <input
              className="input"
              type="password"
              name="password"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
