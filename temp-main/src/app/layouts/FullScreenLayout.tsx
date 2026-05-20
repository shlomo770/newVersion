import type { ReactNode } from 'react';
import styles from './FullScreenLayout.module.css';

export type FullScreenLayoutVariant = 'splash' | 'maintenance' | 'tactical';

export interface FullScreenLayoutProps {
  children: ReactNode;
  variant?: FullScreenLayoutVariant;
  /** When true, children scroll inside the locked viewport. Default true. */
  scrollable?: boolean;
  className?: string;
}

const variantClass: Record<FullScreenLayoutVariant, string> = {
  splash: styles.splash,
  maintenance: styles.maintenance,
  tactical: styles.tactical,
};

/**
 * Full-viewport page shell for mode selection, maintenance, and standalone views.
 */
export function FullScreenLayout({
  children,
  variant = 'tactical',
  scrollable = true,
  className = '',
}: FullScreenLayoutProps) {
  const rootClass = [styles.root, variantClass[variant], className].filter(Boolean).join(' ');

  if (!scrollable) {
    return (
      <div className={rootClass} data-layout="fullscreen">
        {children}
      </div>
    );
  }

  return (
    <div className={rootClass} data-layout="fullscreen">
      <div className={styles.scroll}>{children}</div>
    </div>
  );
}
