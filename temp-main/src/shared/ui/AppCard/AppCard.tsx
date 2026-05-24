import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../themeUtils';
import styles from './AppCard.module.css';

export interface AppCardProps extends HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  interactive?: boolean;
  compact?: boolean;
  children: ReactNode;
}

export function AppCard({
  active = false,
  interactive = false,
  compact = false,
  className,
  children,
  ...rest
}: AppCardProps) {
  return (
    <div
      className={cn(
        styles.card,
        interactive && styles.interactive,
        active && styles.active,
        compact && styles.compact,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
