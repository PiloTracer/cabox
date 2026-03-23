'use client';

import { useEffect, useState, useCallback } from 'react';

interface SinpeConfig    { enabled: boolean; phone: string; accountName: string }
interface TransferConfig { enabled: boolean; bankName: string; iban: string; accountName: string }
interface SimpleConfig   { enabled: boolean }

interface PaymentConfig {
  SINPE?:    SinpeConfig;
  TRANSFER?: TransferConfig;
  CASH?:     SimpleConfig;
  STRIPE?:   SimpleConfig;
  PAYPAL?:   SimpleConfig;
}

interface Settings {
  storeName:      string;
  storeTagline:   string;
  supportPhone:   string;
  paymentMethods: PaymentConfig;
}

const DEFAULTS: Settings = {
  storeName:    'Cabox',
  storeTagline: 'Moda Curada de Costa Rica',
  supportPhone: '',
  paymentMethods: {
    SINPE:    { enabled: true,  phone: '', accountName: '' },
    TRANSFER: { enabled: false, bankName: '', iban: '', accountName: '' },
    CASH:     { enabled: true },
    STRIPE:   { enabled: false },
    PAYPAL:   { enabled: false },
  },
};

const METHOD_META = [
  { key: 'SINPE',    emoji: '📱', label: 'SINPE Móvil',          desc: 'Transferencia instantánea por SINPE Móvil' },
  { key: 'TRANSFER', emoji: '🏦', label: 'Transferencia bancaria', desc: 'Transferencia IBAN a cuenta bancaria' },
  { key: 'CASH',     emoji: '💵', label: 'Efectivo',              desc: 'Pago en efectivo al momento de la entrega' },
  { key: 'STRIPE',   emoji: '💳', label: 'Tarjeta de crédito',   desc: 'Stripe — Visa, Mastercard, AMEX' },
  { key: 'PAYPAL',   emoji: '🅿️', label: 'PayPal',               desc: 'Pagos con cuenta PayPal' },
];

export default function PaymentSettingsForm() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings({
          storeName:    data.storeName,
          storeTagline: data.storeTagline,
          supportPhone: data.supportPhone,
          paymentMethods: data.paymentMethods ?? DEFAULTS.paymentMethods,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pm = settings.paymentMethods as Record<string, Record<string, unknown>>;

  const toggleMethod = (key: string) => {
    setSettings(prev => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        [key]: { ...(pm[key] ?? {}), enabled: !pm[key]?.enabled },
      },
    }));
  };

  const updateField = (method: string, field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        [method]: { ...(pm[method] ?? {}), [field]: value },
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError('Error al guardar la configuración.');
      }
    } catch {
      setError('Error de red al guardar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        Cargando configuración…
      </div>
    );
  }

  const enabledCount = METHOD_META.filter(m => pm[m.key]?.enabled).length;

  return (
    <div className="settings-form">
      {/* Section subtitle */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p className="settings-section-title">Métodos disponibles</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}>
            Activa los métodos de pago que ofreces. Las instrucciones se muestran al cliente al finalizar la compra.
          </p>
        </div>
        <span className="badge" style={{ background: 'rgba(139,94,60,0.12)', color: 'var(--color-primary)', fontWeight: 700, whiteSpace: 'nowrap' }}>
          {enabledCount} activo{enabledCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Method cards */}
      <div className="settings-methods-list">
        {METHOD_META.map(({ key, emoji, label, desc }) => {
          const cfg    = pm[key] ?? {};
          const active = !!cfg.enabled;

          return (
            <div key={key} className={`settings-method-card ${active ? 'active' : ''}`}>
              {/* Header */}
              <div className="settings-method-header" onClick={() => toggleMethod(key)}>
                <span className="settings-method-icon">{emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="settings-method-label">{label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{desc}</div>
                </div>
                <span className={`settings-method-badge ${active ? 'enabled' : 'disabled'}`}>
                  {active ? 'Activo' : 'Inactivo'}
                </span>
                {/* Toggle switch */}
                <label className="settings-toggle" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleMethod(key)}
                  />
                  <span className="settings-toggle-track">
                    <span className="settings-toggle-thumb" />
                  </span>
                </label>
              </div>

              {/* Config fields — only when enabled */}
              {active && (
                <div className="settings-method-config">
                  {key === 'SINPE' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Número SINPE Móvil</label>
                        <input
                          className="input"
                          placeholder="+506 8888-8888"
                          value={(cfg.phone as string) ?? ''}
                          onChange={e => updateField('SINPE', 'phone', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Nombre del titular</label>
                        <input
                          className="input"
                          placeholder="Nombre completo registrado"
                          value={(cfg.accountName as string) ?? ''}
                          onChange={e => updateField('SINPE', 'accountName', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {key === 'TRANSFER' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Nombre del banco</label>
                        <input
                          className="input"
                          placeholder="Banco Nacional, BAC…"
                          value={(cfg.bankName as string) ?? ''}
                          onChange={e => updateField('TRANSFER', 'bankName', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">IBAN</label>
                        <input
                          className="input"
                          placeholder="CR00 0000 0000 0000 0000 00"
                          value={(cfg.iban as string) ?? ''}
                          onChange={e => updateField('TRANSFER', 'iban', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                        <label className="form-label">Nombre del titular</label>
                        <input
                          className="input"
                          placeholder="Nombre completo (tal como aparece en la cuenta)"
                          value={(cfg.accountName as string) ?? ''}
                          onChange={e => updateField('TRANSFER', 'accountName', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {key === 'CASH' && (
                    <p className="settings-method-note">
                      ✅ El cliente paga en efectivo al momento de la entrega. Se coordinará la entrega por WhatsApp. No se requiere configuración adicional.
                    </p>
                  )}

                  {key === 'STRIPE' && (
                    <p className="settings-method-note">
                      🔑 Las credenciales de Stripe se configuran via variables de entorno: <code>STRIPE_SECRET_KEY</code> y <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>.
                    </p>
                  )}

                  {key === 'PAYPAL' && (
                    <p className="settings-method-note">
                      🔑 Las credenciales de PayPal se configuran via variables de entorno: <code>NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> y <code>PAYPAL_CLIENT_SECRET</code>.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save bar */}
      {error && <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}
      <div className="settings-save-bar">
        {saved && (
          <span className="settings-save-status">
            ✅ Guardado correctamente
          </span>
        )}
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ minWidth: '180px', justifyContent: 'center' }}
        >
          {saving ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite', marginRight: 6 }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Guardando…
            </>
          ) : 'Guardar configuración'}
        </button>
      </div>
    </div>
  );
}
