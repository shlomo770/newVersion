import type { SelectHTMLAttributes, ReactNode } from 'react';
import { cn } from '../themeUtils';

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
    <div className={cn('jbk-field', fieldClassName)}>
      {label ? (
        <label htmlFor={selectId} className="jbk-label">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className={cn('jbk-select', compact && 'jbk-select--compact', className)}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}
