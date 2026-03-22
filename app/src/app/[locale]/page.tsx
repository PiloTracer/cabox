import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('home');

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '4rem 1.5rem' }}>
      <div className="container">
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', marginBottom: '1rem' }}>
          {t('welcome')}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '1.125rem' }}>
          {t('tagline')}
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/products" className="btn btn-primary btn-lg">
            {t('shopNow')}
          </Link>
        </div>
      </div>
    </main>
  );
}
