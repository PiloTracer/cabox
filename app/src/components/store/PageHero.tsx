import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type PageHeroVariant = 'default' | 'compact';

function showSubtitle(subtitle: ReactNode | undefined): boolean {
  if (subtitle === undefined || subtitle === null) return false;
  if (typeof subtitle === 'string') return subtitle.trim().length > 0;
  return true;
}

export interface PageHeroProps {
  title: ReactNode;
  subtitle?: ReactNode;
  variant?: PageHeroVariant;
  className?: string;
}

/**
 * Shared top-of-page banner for store routes. Variants adjust vertical padding;
 * department theme JSON can further override `--page-hero-padding-y` on `.theme-dept-*`.
 */
export function PageHero({ title, subtitle, variant = 'default', className }: PageHeroProps) {
  return (
    <div
      className={cn(
        'page-hero',
        variant === 'compact' && 'page-hero--compact',
        className,
      )}
    >
      <div className="container">
        <h1 className="page-hero-title">{title}</h1>
        {showSubtitle(subtitle) ? (
          <p className="page-hero-meta">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
