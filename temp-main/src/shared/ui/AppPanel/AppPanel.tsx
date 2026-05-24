import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../themeUtils';
import styles from './AppPanel.module.css';

export interface AppPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
  translucent?: boolean;
  scrollBody?: boolean;
  children: ReactNode;
}

export function AppPanel({
  title,
  headerActions,
  footer,
  translucent = false,
  scrollBody = false,
  className,
  children,
  ...rest
}: AppPanelProps) {
  const bodyClass = scrollBody ? cn(styles.body, styles.scrollBody) : styles.body;

  return (
    <div className={cn(styles.panel, translucent && styles.translucent, className)} {...rest}>
      {title || headerActions ? (
        <div className={styles.header}>
          {title ? <h3 className={styles.title}>{title}</h3> : <span />}
          {headerActions}
        </div>
      ) : null}
      <div className={bodyClass}>{children}</div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </div>
  );
}
