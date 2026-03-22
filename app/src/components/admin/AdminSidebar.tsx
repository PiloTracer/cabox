'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tag,
  Truck,
  Settings,
  LogOut,
} from 'lucide-react';

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Productos', icon: ShoppingBag },
  { href: '/admin/orders', label: 'Pedidos', icon: Package },
  { href: '/admin/categories', label: 'Categorías', icon: Tag },
  { href: '/admin/shipping', label: 'Envíos', icon: Truck },
  { href: '/admin/settings', label: 'Configuración', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-logo">⬡ Cabox</div>

      <nav className="admin-nav">
        {links.map(({ href, label, icon: Icon }) => {
          const exact = href === '/admin';
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`admin-nav-link ${active ? 'active' : ''}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <button
          className="admin-nav-link"
          style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'transparent' }}
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
