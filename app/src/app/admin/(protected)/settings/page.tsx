import { requireAdmin } from '@/lib/auth-guard';
import SettingsClient from '@/components/admin/SettingsClient';

export const metadata = { title: 'Configuración — Cabox Admin' };

export default async function SettingsPage() {
  const authError = await requireAdmin();
  if (authError) return authError;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>
            ⚙️ Configuración
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Administra los métodos de pago y otras preferencias de la tienda.
          </p>
        </div>
      </div>

      <SettingsClient />
    </div>
  );
}

