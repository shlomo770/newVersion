import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../themeUtils';

export interface AppFormStackProps extends HTMLAttributes<HTMLDivElement> {
  /** Horizontal row of fields instead of vertical stack. */
  row?: boolean;
  /** Action button row aligned to the end. */
  actions?: boolean;
  children: ReactNode;
}

export function AppFormStack({
  row = false,
  actions = false,
  className,
  children,
  ...rest
}: AppFormStackProps) {
  return (
    <div
      className={cn(
        row ? 'jbk-form-row' : actions ? 'jbk-form-actions' : 'jbk-form-stack',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
