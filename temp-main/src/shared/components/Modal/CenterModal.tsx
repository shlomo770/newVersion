import type { ReactNode } from 'react';
import { AppModal, type AppModalProps } from '@shared/ui';

export interface CenterModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  ariaLabelledBy?: string;
}

/** @deprecated Prefer `AppModal` from `@shared/ui`. Kept for backward compatibility. */
export function CenterModal({ open, onClose, children, width, ariaLabelledBy }: CenterModalProps) {
  const modalProps: AppModalProps = {
    open,
    onClose,
    width,
    ariaLabelledBy,
    children,
  };
  return <AppModal {...modalProps} />;
}
