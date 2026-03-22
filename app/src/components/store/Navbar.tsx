'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ShoppingCart, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '@/stores/cart-store';

interface NavbarProps {
  locale: string;
}

export default function Navbar({ locale }: NavbarProps) {
  const t = useTranslations('nav');
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const itemCount = useCartStore((s) => s.totalItems());

  const base = `/${locale}`;

  return (
    <>
      <header className="navbar">
        <div className="container navbar-inner">
          {/* Logo */}
          <Link href={base} className="navbar-logo">
            Cabox
          </Link>

          {/* Desktop nav */}
          <nav className="navbar-links">
            <Link href={`${base}/products`} className="navbar-link">{t('products')}</Link>
            <Link href={`${base}/products?cat=mujeres`} className="navbar-link">Mujeres</Link>
            <Link href={`${base}/products?cat=hombres`} className="navbar-link">Hombres</Link>
            <Link href={`${base}/products?cat=accesorios`} className="navbar-link">Accesorios</Link>
          </nav>

          {/* Actions */}
          <div className="navbar-actions">
            <Link href={`${base}/search`} className="navbar-icon-btn" aria-label={t('search')}>
              <Search size={20} />
            </Link>

            <button
              className="navbar-icon-btn navbar-cart-btn"
              onClick={() => setCartOpen(true)}
              aria-label={t('cart')}
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="cart-count">{itemCount > 99 ? '99+' : itemCount}</span>
              )}
            </button>

            <button
              className="navbar-icon-btn mobile-only"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="mobile-menu">
            <Link href={`${base}/products`} className="mobile-menu-link" onClick={() => setMenuOpen(false)}>{t('products')}</Link>
            <Link href={`${base}/products?cat=mujeres`} className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Mujeres</Link>
            <Link href={`${base}/products?cat=hombres`} className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Hombres</Link>
            <Link href={`${base}/products?cat=accesorios`} className="mobile-menu-link" onClick={() => setMenuOpen(false)}>Accesorios</Link>
          </div>
        )}
      </header>

      {cartOpen && (
        <CartDrawer onClose={() => setCartOpen(false)} locale={locale} />
      )}
    </>
  );
}

function CartDrawer({ onClose, locale }: { onClose: () => void; locale: string }) {
  const t = useTranslations('cart');
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n);

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer-panel animate-slide-in">
        <div className="drawer-header">
          <h2 className="drawer-title">{t('title')}</h2>
          <button className="navbar-icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {items.length === 0 ? (
          <div className="drawer-empty">
            <ShoppingCart size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p>{t('empty')}</p>
            <Link
              href={`/${locale}/products`}
              className="btn btn-primary btn-sm"
              style={{ marginTop: '1rem' }}
              onClick={onClose}
            >
              {t('continueShopping')}
            </Link>
          </div>
        ) : (
          <>
            <ul className="drawer-items">
              {items.map((item) => (
                <li key={`${item.id}-${item.variantId ?? ''}`} className="drawer-item">
                  <div className="drawer-item-info">
                    <p className="drawer-item-name">{locale === 'es' ? item.nameEs : item.nameEn}</p>
                    <p className="drawer-item-price price">{fmt(item.price)}</p>
                  </div>
                  <div className="drawer-item-controls">
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.variantId, item.quantity - 1)}>−</button>
                    <span className="qty-value">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.variantId, item.quantity + 1)}>+</button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeItem(item.id, item.variantId)}
                      style={{ color: 'var(--color-error)' }}
                    >
                      {t('remove')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="drawer-footer">
              <div className="drawer-totals">
                <div className="drawer-total-row">
                  <span>{t('subtotal')}</span>
                  <span className="price">{fmt(subtotal)}</span>
                </div>
              </div>
              <Link
                href={`/${locale}/checkout`}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={onClose}
              >
                {t('checkout')}
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
