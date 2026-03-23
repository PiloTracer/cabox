'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const GeneralSettingsForm = dynamic(
  () => import('@/components/admin/GeneralSettingsForm'),
  { ssr: false, loading: () => <div className="settings-loading">Cargando…</div> }
);

const PaymentSettingsForm = dynamic(
  () => import('@/components/admin/PaymentSettingsForm'),
  { ssr: false, loading: () => <div className="settings-loading">Cargando…</div> }
);

type Tab = 'general' | 'payments';

export default function SettingsClient() {
  const [tab, setTab] = useState<Tab>('general');

  return (
    <div className="settings-page">
      {/* Tab bar */}
      <div className="settings-tabs">
        <button
          className={`settings-tab ${tab === 'general' ? 'active' : ''}`}
          onClick={() => setTab('general')}
        >
          🏪 General
        </button>
        <button
          className={`settings-tab ${tab === 'payments' ? 'active' : ''}`}
          onClick={() => setTab('payments')}
        >
          💳 Métodos de Pago
        </button>
      </div>

      {/* Tab content */}
      <div className="settings-tab-content">
        {tab === 'general'   && <GeneralSettingsForm />}
        {tab === 'payments'  && <PaymentSettingsForm />}
      </div>
    </div>
  );
}
