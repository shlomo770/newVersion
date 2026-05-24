import type { HTMLAttributes } from 'react';
import { cn } from '../themeUtils';
import styles from './AppSectionTitle.module.css';

export interface AppSectionTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  size?: 'sm' | 'lg';
  withBorder?: boolean;
  centered?: boolean;
}

export function AppSectionTitle({
  size = 'sm',
  withBorder = false,
  centered = false,
  className,
  children,
  ...rest
}: AppSectionTitleProps) {
  return (
    <h3
      className={cn(
        styles.title,
        size === 'lg' && styles.titleLg,
        withBorder && styles.withBorder,
        centered && styles.centered,
        className,
      )}
      {...rest}
    >
      {children}
    </h3>
  );
}
