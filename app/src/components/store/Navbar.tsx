'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ShoppingCart, Search, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/cart-store';
import { formatCRC } from '@/lib/format';

export interface NavDepartment {
  slug: string;
  nameEs: string;
  nameEn: string;
}

interface NavbarProps {
  locale: string;
  departments?: NavDepartment[];
}

export default function Navbar({ locale, departments = [] }: NavbarProps) {
  const t = useTranslations('nav');
  const th = useTranslations('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((s) => s.totalItems());
  const openCart = useCartStore((s) => s.openCart);

  // Prevent hydration mismatch: cart count from localStorage is only available client-side
  useEffect(() => { setMounted(true); }, []);

  const base = `/${locale}`;

  return (
    <>
      <header className="navbar">
        <div className="container navbar-inner">
          {/* Logo */}
          <Link href={base} className="navbar-logo" title={th('brandTitle')}>
            <Image
              src="/logo.png"
              alt="Cabox"
              width={36}
              height={36}
              className="navbar-logo-img"
              priority
            />
            <span>Cabox</span>
          </Link>

          {/* Desktop nav */}
          <nav className="navbar-links">
            <Link href={`${base}/products`} className="navbar-link">{t('products')}</Link>
            {departments.map((d) => (
              <Link key={d.slug} href={`${base}/${d.slug}`} className="navbar-link">
                {locale === 'es' ? d.nameEs : d.nameEn}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="navbar-actions">
            <Link href={`${base}/search`} className="navbar-icon-btn" aria-label={t('search')}>
              <Search size={20} />
            </Link>

            <button
              className="navbar-icon-btn navbar-cart-btn"
              onClick={openCart}
              aria-label={t('cart')}
            >
              <ShoppingCart size={20} />
              {mounted && itemCount > 0 && (
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
            {departments.map((d) => (
              <Link
                key={d.slug}
                href={`${base}/${d.slug}`}
                className="mobile-menu-link"
                onClick={() => setMenuOpen(false)}
              >
                {locale === 'es' ? d.nameEs : d.nameEn}
              </Link>
            ))}
          </div>
        )}
      </header>
    </>
  );
}
