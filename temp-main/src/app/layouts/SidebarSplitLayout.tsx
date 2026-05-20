import type { CSSProperties, ReactNode } from 'react';
import styles from './SidebarSplitLayout.module.css';

export interface SidebarSplitLayoutProps {
  sidebar?: ReactNode;
  main: ReactNode;
  /** Sidebar width (CSS length). Default uses layout token. */
  sidebarWidth?: string;
  className?: string;
}

/**
 * Horizontal split: persistent sidebar registry + primary content pane.
 */
export function SidebarSplitLayout({
  sidebar,
  main,
  sidebarWidth = 'var(--layout-sidebar-offset)',
  className = '',
}: SidebarSplitLayoutProps) {
  const rootClass = className ? `${styles.root} ${className}` : styles.root;
  const sidebarStyle: CSSProperties = { width: sidebarWidth };

  return (
    <div className={rootClass} data-layout="sidebar-split">
      {sidebar ? (
        <aside className={styles.sidebar} style={sidebarStyle} data-region="sidebar">
          {sidebar}
        </aside>
      ) : null}
      <section className={styles.main} data-region="main">
        {main}
      </section>
    </div>
  );
}
