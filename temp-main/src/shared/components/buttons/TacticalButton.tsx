import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from '../feedback/Spinner';
import styles from './TacticalButton.module.css';

export type TacticalButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type TacticalButtonSize = 'sm' | 'md' | 'lg';

export interface TacticalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TacticalButtonVariant;
  size?: TacticalButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantClass: Record<TacticalButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  danger: styles.danger,
  ghost: styles.ghost,
};

const sizeClass: Record<TacticalButtonSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

export function TacticalButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: TacticalButtonProps) {
  const classes = [
    styles.button,
    variantClass[variant],
    sizeClass[size],
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
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
