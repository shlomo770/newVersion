import type { ReactNode, MouseEvent } from 'react';
import styles from './CenterModal.module.css';

export interface CenterModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Panel width in pixels. Default 320. */
  width?: number;
  /** Optional id for accessibility wiring. */
  ariaLabelledBy?: string;
}

export function CenterModal({
  open,
  onClose,
  children,
  width = 320,
  ariaLabelledBy,
}: CenterModalProps) {
  if (!open) return null;

  const stopPanelClose = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div className={styles.backdrop} role="presentation">
      <div className={styles.scrim} onClick={onClose} aria-hidden />
      <div
        className={styles.panel}
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        onClick={stopPanelClose}
      >
        {children}
      </div>
    </div>
  );
}
