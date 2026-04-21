import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Main content column below a store hero — consistent vertical rhythm. */
export function StoreMain({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('store-main', className)}>{children}</div>;
}

/** Full-width section + centered container (home featured, marketing blocks). */
export function StoreSection({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn('section', className)}>
      <div className="container">{children}</div>
    </section>
  );
}

export function StoreSectionHeader({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('store-section-header', className)}>
      <h2 className="store-section-heading">{title}</h2>
      {action ? <div className="store-section-header-action">{action}</div> : null}
    </div>
  );
}
