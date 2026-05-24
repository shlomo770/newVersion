import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../themeUtils';
import styles from './AppIconButton.module.css';

export type AppIconButtonSize = 'sm' | 'md' | 'lg';

export interface AppIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: AppIconButtonSize;
  danger?: boolean;
  label: string;
  children: ReactNode;
}

const sizeClass: Record<AppIconButtonSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

export function AppIconButton({
  size = 'md',
  danger = false,
  label,
  className,
  children,
  type = 'button',
  ...rest
}: AppIconButtonProps) {
  return (
    <button
      type={type}
      className={cn(styles.button, sizeClass[size], danger && styles.danger, className)}
      aria-label={label}
      title={label}
      {...rest}
    >
      {children}
    </button>
  );
}
