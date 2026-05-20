import type { ReactNode } from 'react';
import styles from './AppShell.module.css';

export interface AppShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * Top-level tactical viewport shell: locks document scrolling and fills the screen.
 */
export function AppShell({ children, className = '' }: AppShellProps) {
  const rootClass = className ? `${styles.root} ${className}` : styles.root;

  return (
    <div className={rootClass} data-layout="app-shell">
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
