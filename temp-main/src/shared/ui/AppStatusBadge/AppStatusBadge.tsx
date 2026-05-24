import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../themeUtils';
import styles from './AppStatusBadge.module.css';

export type AppStatusBadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'active';

export interface AppStatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: AppStatusBadgeVariant;
  children: ReactNode;
}

const variantClass: Record<AppStatusBadgeVariant, string> = {
  default: styles.default,
  success: styles.success,
  warning: styles.warning,
  danger: styles.danger,
  info: styles.info,
  active: styles.active,
};

export function AppStatusBadge({
  variant = 'default',
  className,
  children,
  ...rest
}: AppStatusBadgeProps) {
  return (
    <span className={cn(styles.badge, variantClass[variant], className)} {...rest}>
      {children}
    </span>
  );
}
