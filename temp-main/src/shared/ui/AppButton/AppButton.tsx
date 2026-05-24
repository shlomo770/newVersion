import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from '@shared/components/feedback/Spinner';
import { cn } from '../themeUtils';

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
  primary: 'jbk-btn--primary',
  secondary: 'jbk-btn--secondary',
  danger: 'jbk-btn--danger',
  success: 'jbk-btn--success',
  ghost: 'jbk-btn--ghost',
  icon: 'jbk-btn--icon',
};

const sizeClass: Record<AppButtonSize, string> = {
  sm: 'jbk-btn--sm',
  md: 'jbk-btn--md',
  lg: 'jbk-btn--lg',
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
        'jbk-btn',
        variantClass[variant],
        variant !== 'icon' ? sizeClass[size] : 'jbk-btn--sm',
        fullWidth && 'jbk-btn--full',
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className="inline-flex">
          <Spinner size={size === 'sm' ? 14 : size === 'lg' ? 22 : 18} stroke={2} />
        </span>
      ) : null}
      {children}
    </button>
  );
}
