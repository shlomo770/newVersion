import type { InputHTMLAttributes } from 'react';
import { cn } from '../themeUtils';
import styles from './AppInput.module.css';

export interface AppInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  compact?: boolean;
  fieldClassName?: string;
}

export function AppInput({
  label,
  compact = false,
  className,
  fieldClassName,
  id,
  ...rest
}: AppInputProps) {
  const inputId = id ?? (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  return (
    <div className={cn(styles.field, fieldClassName)}>
      {label ? (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn(styles.input, compact && styles.compact, className)}
        {...rest}
      />
    </div>
  );
}
