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
  Users,
  Boxes,
  Percent,
  Ticket,
  BarChart2,
  Settings,
  LogOut,
} from 'lucide-react';

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Productos', icon: ShoppingBag },
  { href: '/admin/orders', label: 'Pedidos', icon: Package },
  { href: '/admin/categories', label: 'Categorías', icon: Tag },
  { href: '/admin/inventory', label: 'Inventario', icon: Boxes },
  { href: '/admin/customers', label: 'Clientes', icon: Users },
  { href: '/admin/shipping', label: 'Envíos', icon: Truck },
  { href: '/admin/promotions', label: 'Promociones', icon: Percent },
  { href: '/admin/coupons', label: 'Cupones', icon: Ticket },
  { href: '/admin/reports', label: 'Reportes', icon: BarChart2 },
  { href: '/admin/settings', label: 'Configuración', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="logo-icon">⬡</span>
          <span className="logo-text">Cabox</span>
        </div>
      </div>

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
              <span className="nav-label">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="admin-logout-wrap">
        <button
          className="admin-nav-link logout-btn"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
        >
          <LogOut size={18} />
          <span className="nav-label">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
