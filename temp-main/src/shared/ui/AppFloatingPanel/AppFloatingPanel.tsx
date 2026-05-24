import type { HTMLAttributes, ReactNode } from 'react';
import { FaTimes } from 'react-icons/fa';
import { AppIconButton } from '../AppIconButton/AppIconButton';
import { cn } from '../themeUtils';
import styles from './AppFloatingPanel.module.css';

export type AppFloatingPanelPosition = 'left' | 'right' | 'center';

export interface AppFloatingPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  position?: AppFloatingPanelPosition;
  translucent?: boolean;
  showClose?: boolean;
  children: ReactNode;
}

const positionClass: Record<AppFloatingPanelPosition, string> = {
  left: styles.positionLeft,
  right: styles.positionRight,
  center: styles.positionCenter,
};

export function AppFloatingPanel({
  open,
  onClose,
  title,
  position = 'left',
  translucent = false,
  showClose = true,
  className,
  children,
  style,
  ...rest
}: AppFloatingPanelProps) {
  if (!open) return null;

  return (
    <div
      className={cn(
        styles.panel,
        positionClass[position],
        translucent && styles.translucent,
        className,
      )}
      style={style}
      {...rest}
    >
      {showClose && onClose ? (
        <AppIconButton
          label="Close"
          size="md"
          className={styles.closeButton}
          onClick={onClose}
        >
          <FaTimes size={18} />
        </AppIconButton>
      ) : null}
      {title ? (
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>
      ) : null}
      <div className={styles.body}>{children}</div>
    </div>
  );
}
