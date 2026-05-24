import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from '@shared/components/feedback/Spinner';
import { cn } from '../themeUtils';
import styles from './AppButton.module.css';

export type AppButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'icon';
export type AppButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantClass: Record<AppButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  danger: styles.danger,
  success: styles.success,
  ghost: styles.ghost,
  icon: styles.icon,
};

const sizeClass: Record<AppButtonSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

export function AppButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: AppButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        styles.button,
        variantClass[variant],
        variant !== 'icon' ? sizeClass[size] : styles.sm,
        fullWidth && styles.fullWidth,
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className={styles.spinnerSlot}>
          <Spinner size={size === 'sm' ? 14 : size === 'lg' ? 22 : 18} stroke={2} />
        </span>
      ) : null}
      {children}
    </button>
  );
}
