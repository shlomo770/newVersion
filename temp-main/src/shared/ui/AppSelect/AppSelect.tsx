import type { SelectHTMLAttributes, ReactNode } from 'react';
import { cn } from '../themeUtils';
import styles from './AppSelect.module.css';

export interface AppSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  compact?: boolean;
  fieldClassName?: string;
  children: ReactNode;
}

export function AppSelect({
  label,
  compact = false,
  className,
  fieldClassName,
  id,
  children,
  ...rest
}: AppSelectProps) {
  const selectId = id ?? (label ? `select-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  return (
    <div className={cn(styles.field, fieldClassName)}>
      {label ? (
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className={cn(styles.select, compact && styles.compact, className)}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}
