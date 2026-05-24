import type { MouseEvent, ReactNode } from 'react';
import { cn } from '../themeUtils';
import styles from './AppModal.module.css';

export interface AppModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  width?: number;
  ariaLabelledBy?: string;
  className?: string;
}

export function AppModal({
  open,
  onClose,
  title,
  footer,
  children,
  width = 320,
  ariaLabelledBy,
  className,
}: AppModalProps) {
  if (!open) return null;

  const stopPanelClose = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div className={styles.backdrop} role="presentation">
      <div className={styles.scrim} onClick={onClose} aria-hidden />
      <div
        className={cn(styles.panel, className)}
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        onClick={stopPanelClose}
      >
        {title ? (
          <div className={styles.header}>
            <h2 className={styles.title} id={ariaLabelledBy}>
              {title}
            </h2>
          </div>
        ) : null}
        <div className={styles.body}>{children}</div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>
  );
}
