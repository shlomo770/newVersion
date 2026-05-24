import type { InputHTMLAttributes } from 'react';
import { cn } from '../themeUtils';

export interface AppInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  compact?: boolean;
  /** Center-align text (coordinates, numeric fields). */
  center?: boolean;
  /** Monospace font for coordinates / telemetry. */
  mono?: boolean;
  /** Transparent inline variant (status bar, embedded fields). */
  inline?: boolean;
  fieldClassName?: string;
}

export function AppInput({
  label,
  compact = false,
  center = false,
  mono = false,
  inline = false,
  className,
  fieldClassName,
  id,
  ...rest
}: AppInputProps) {
  const inputId = id ?? (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  return (
    <div className={cn('jbk-field', fieldClassName)}>
      {label ? (
        <label htmlFor={inputId} className="jbk-label">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn(
          'jbk-control',
          compact && 'jbk-control--compact',
          center && 'jbk-control--center',
          mono && 'jbk-control--mono',
          inline && 'jbk-control--inline',
          className,
        )}
        {...rest}
      />
    </div>
  );
}
