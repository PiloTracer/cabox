'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/stores/cart-store';
import Image from 'next/image';
import Link from 'next/link';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CartDrawerProps {
  locale: string;
}

export function CartDrawer({ locale }: CartDrawerProps) {
  const t = useTranslations('cart');
  const [mounted, setMounted] = useState(false);
  const { isCartOpen, closeCart, items, removeItem, updateQuantity, subtotal } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      {isCartOpen && (
        <div
          onClick={closeCart}
          className="fixed inset-0 bg-black/50 z-[100] transition-opacity backdrop-blur-sm"
          aria-hidden="true"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-[101] shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col`}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100%',
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#fff',
          zIndex: 1001,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
          transform: isCartOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={20} />
            {t('title')}
          </h2>
          <button
            onClick={closeCart}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#6b7280' }}
            aria-label="Close cart"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {items.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280', textAlign: 'center' }}>
              <ShoppingBag size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 500 }}>{t('empty')}</p>
              <p style={{ fontSize: '0.9rem' }}>Explorá nuestros productos y sumalos acá.</p>
              <button
                onClick={closeCart}
                style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', background: '#f4f4f5', borderRadius: '0.5rem', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                Seguir comprando
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {items.map((item) => (
                <div key={`${item.id}-${item.variantId || 'base'}`} style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '0.5rem', overflow: 'hidden', background: '#f4f4f5', flexShrink: 0 }}>
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={locale === 'es' ? item.nameEs : item.nameEn} width={80} height={80} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>No img</div>
                    )}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, lineHeight: 1.3 }}>
                        <Link href={`/${locale}/products/${item.slug}`} onClick={closeCart} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {locale === 'es' ? item.nameEs : item.nameEn}
                        </Link>
                      </h3>
                      <button
                        onClick={() => removeItem(item.id, item.variantId)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.2rem' }}
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {item.attributes && Object.keys(item.attributes).length > 0 && (
                      <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.25rem 0' }}>
                        {Object.entries(item.attributes).map(([k, v]) => `${v}`).join(' / ')}
                      </p>
                    )}
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '0.375rem', overflow: 'hidden' }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.variantId, item.quantity - 1)}
                          style={{ padding: '0.25rem 0.5rem', background: '#f9fafb', border: 'none', borderRight: '1px solid #e5e7eb', cursor: 'pointer' }}
                        >-</button>
                        <span style={{ padding: '0 0.75rem', fontSize: '0.9rem', fontWeight: 500 }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.variantId, item.quantity + 1)}
                          style={{ padding: '0.25rem 0.5rem', background: '#f9fafb', border: 'none', borderLeft: '1px solid #e5e7eb', cursor: 'pointer' }}
                        >+</button>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                        ₡{(item.price * item.quantity).toLocaleString('es-CR')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700 }}>
              <span>Subtotal</span>
              <span>₡{subtotal().toLocaleString('es-CR')}</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', textAlign: 'center', marginBottom: '1rem' }}>
              Los costos de envío se calcularán en el checkout.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link href={`/${locale}/checkout`} onClick={closeCart} style={{ display: 'block', width: '100%', padding: '1rem', background: '#000', color: '#fff', textAlign: 'center', borderRadius: '0.5rem', fontWeight: 600, textDecoration: 'none' }}>
                Ir al Checkout
              </Link>
              <Link href={`/${locale}/cart`} onClick={closeCart} style={{ display: 'block', width: '100%', padding: '0.75rem', background: '#fff', color: '#000', border: '1px solid #e5e7eb', textAlign: 'center', borderRadius: '0.5rem', fontWeight: 500, textDecoration: 'none' }}>
                Ver opciones de carrito
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
