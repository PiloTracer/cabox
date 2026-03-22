import { ReactNode } from 'react';

// Root admin layout — deliberately minimal (no auth check here).
// Auth protection lives in admin/(protected)/layout.tsx.
// This layout only wraps /admin/login so it renders without redirect loops.
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
