'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
      {/* Decorative background blobs */}
      <div className="login-blob login-blob-1" />
      <div className="login-blob login-blob-2" />

      <div className="login-card animate-fade-in">
        {/* Logo */}
        <div className="login-logo-wrap">
          <Image
            src="/logo.jpeg"
            alt="Cabox — Curated Fashion"
            width={96}
            height={96}
            className="login-logo-img"
            priority
          />
        </div>

        <div className="login-brand">
          <span className="login-brand-name">Cabox</span>
          <span className="login-brand-tag">Panel de administración</span>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="admin@tutienda.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Contraseña</label>
            <input
              id="password"
              className="input"
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
          >
            {loading ? (
              <>
                <span className="spin" style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                Iniciando sesión…
              </>
            ) : 'Iniciar sesión'}
          </button>
        </form>

        <p className="login-footer-text">
          Cabox — Curated Fashion &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
