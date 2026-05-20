import type { ReactNode } from 'react';
import styles from './AlertBox.module.css';

export type AlertVariant = 'info' | 'warning' | 'error' | 'success';

export interface AlertBoxProps {
  variant: AlertVariant;
  title?: string;
  message: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
}

const variantClass: Record<AlertVariant, string> = {
  info: styles.info,
  warning: styles.warning,
  error: styles.error,
  success: styles.success,
};

export function AlertBox({
  variant,
  title,
  message,
  onDismiss,
  dismissLabel = 'סגור',
  className = '',
}: AlertBoxProps) {
  const rootClass = [styles.root, variantClass[variant], className].filter(Boolean).join(' ');

  return (
    <div className={rootClass} role="alert">
      <div className={styles.body}>
        {title ? <p className={styles.title}>{title}</p> : null}
        <div className={styles.message}>{message}</div>
      </div>
      {onDismiss ? (
        <button
          type="button"
          className={styles.dismiss}
          onClick={onDismiss}
          aria-label={dismissLabel}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
