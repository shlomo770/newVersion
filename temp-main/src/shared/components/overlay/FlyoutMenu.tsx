import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { useClickOutside } from '@shared/hooks/useClickOutside';
import styles from './FlyoutMenu.module.css';

export type FlyoutPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface FlyoutMenuProps {
  anchorRef: RefObject<HTMLElement>;
  isOpen: boolean;
  placement?: FlyoutPlacement;
  onClose: () => void;
  children: ReactNode;
  top?: number;
  left?: number;
  /** Arrow horizontal offset in px when placement is top/bottom. */
  arrowOffset?: number;
  /** @deprecated Use `arrowOffset`. */
  arow?: number;
  className?: string;
}

export function FlyoutMenu({
  anchorRef,
  isOpen,
  placement = 'bottom',
  onClose,
  children,
  top,
  left,
  arrowOffset,
  arow,
  className = '',
}: FlyoutMenuProps) {
  const resolvedArrowOffset = arrowOffset ?? arow;
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({
    top: top ?? 0,
    left: left ?? 0,
  });

  useLayoutEffect(() => {
    if (!anchorRef.current || !isOpen) return;
    const rect = anchorRef.current.getBoundingClientRect();
    let calculatedTop = 0;
    let calculatedLeft = 0;

    switch (placement) {
      case 'bottom':
        calculatedTop = top ?? 75.5;
        calculatedLeft = left ?? rect.left + rect.width / 2;
        break;
      case 'top':
        calculatedTop = top ?? rect.top - 8;
        calculatedLeft = left ?? rect.left + rect.width / 2;
        break;
      case 'left':
        calculatedTop = top ?? rect.top + rect.height / 2;
        calculatedLeft = left ?? rect.left - 8;
        break;
      case 'right':
        calculatedTop = top ?? rect.top + rect.height / 2;
        calculatedLeft = left ?? rect.right + 8;
        break;
    }

    setCoords({ top: calculatedTop, left: calculatedLeft });
  }, [anchorRef, isOpen, placement, top, left]);

  useClickOutside([menuRef, anchorRef], onClose, { enabled: isOpen });

  if (!isOpen) return null;

  const menuStyle: CSSProperties = {
    top: `${coords.top}px`,
    left: `${coords.left}px`,
    transform:
      placement === 'bottom' || placement === 'top'
        ? 'translateX(-50%)'
        : 'translateY(-50%)',
  };

  const arrowStyle: CSSProperties = {
    top: placement === 'bottom' ? '-6px' : placement === 'top' ? '100%' : '50%',
    left:
      resolvedArrowOffset !== undefined
        ? `${resolvedArrowOffset}px`
        : placement === 'bottom' || placement === 'top'
          ? '50%'
          : placement === 'left'
            ? '100%'
            : '-6px',
    transform:
      placement === 'left' || placement === 'right'
        ? 'translateY(-50%) rotate(45deg)'
        : 'translateX(-50%) rotate(45deg)',
  };

  const menuClass = className ? `${styles.menu} ${className}` : styles.menu;

  return (
    <div ref={menuRef} className={menuClass} style={menuStyle}>
      <div className={styles.arrow} style={arrowStyle} aria-hidden />
      {children}
    </div>
  );
}

export default FlyoutMenu;
