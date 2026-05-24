import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { useClickOutside } from '@shared/hooks/useClickOutside';
import styles from './FlyoutMenu.module.css';

export type FlyoutPlacement = 'top' | 'bottom' | 'left' | 'right';
export type FlyoutAlign = 'start' | 'center' | 'end';

/** Gap between anchor edge and flyout panel (px). */
const ANCHOR_GAP_PX = 8;
/** Minimum inset from viewport edges (px). */
const VIEWPORT_PADDING_PX = 8;
/** Keep arrow away from menu corners (px). */
const ARROW_EDGE_INSET_PX = 12;

export interface FlyoutMenuProps {
  anchorRef: RefObject<HTMLElement>;
  isOpen: boolean;
  placement?: FlyoutPlacement;
  /** Horizontal alignment relative to anchor for top/bottom placement. */
  align?: FlyoutAlign;
  onClose: () => void;
  children: ReactNode;
  /** Override computed top (viewport px). Prefer anchor-based placement when omitted. */
  top?: number;
  /** Override computed left (viewport px). Prefer anchor-based placement when omitted. */
  left?: number;
  /** Arrow horizontal offset in px when placement is top/bottom. */
  arrowOffset?: number;
  /** @deprecated Use `arrowOffset`. */
  arow?: number;
  className?: string;
}

interface FlyoutCoords {
  top: number;
  left: number;
  arrowLeftPx: number | null;
}

function horizontalTransform(placement: FlyoutPlacement, align: FlyoutAlign): string {
  if (placement !== 'top' && placement !== 'bottom') return '';
  if (align === 'start') return 'none';
  if (align === 'end') return 'translateX(-100%)';
  return 'translateX(-50%)';
}

function verticalTransform(placement: FlyoutPlacement): string {
  if (placement === 'top') return 'translateY(-100%)';
  if (placement === 'left') return 'translate(-100%, -50%)';
  if (placement === 'right') return 'translateY(-50%)';
  return 'none';
}

function combineTransform(placement: FlyoutPlacement, align: FlyoutAlign): string {
  const horizontal = horizontalTransform(placement, align);
  const vertical = verticalTransform(placement);

  if (horizontal === 'none' && vertical === 'none') return 'none';
  if (horizontal === 'none') return vertical;
  if (vertical === 'none') return horizontal;

  if (placement === 'top') {
    if (align === 'center') return 'translate(-50%, -100%)';
    if (align === 'end') return 'translate(-100%, -100%)';
    return 'translateY(-100%)';
  }

  return `${horizontal} ${vertical}`.trim();
}

export function FlyoutMenu({
  anchorRef,
  isOpen,
  placement = 'bottom',
  align = 'center',
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
  const [coords, setCoords] = useState<FlyoutCoords>({
    top: top ?? 0,
    left: left ?? 0,
    arrowLeftPx: null,
  });

  useLayoutEffect(() => {
    if (!anchorRef.current || !isOpen) return;

    const updatePosition = () => {
      const anchorEl = anchorRef.current;
      const menuEl = menuRef.current;
      if (!anchorEl || !menuEl) return;

      const anchor = anchorEl.getBoundingClientRect();
      let calculatedTop = 0;
      let calculatedLeft = 0;

      switch (placement) {
        case 'bottom':
          calculatedTop = top ?? anchor.bottom + ANCHOR_GAP_PX;
          if (left !== undefined) {
            calculatedLeft = left;
          } else if (align === 'start') {
            calculatedLeft = anchor.left;
          } else if (align === 'end') {
            calculatedLeft = anchor.right;
          } else {
            calculatedLeft = anchor.left + anchor.width / 2;
          }
          break;
        case 'top':
          calculatedTop = top ?? anchor.top - ANCHOR_GAP_PX;
          if (left !== undefined) {
            calculatedLeft = left;
          } else if (align === 'start') {
            calculatedLeft = anchor.left;
          } else if (align === 'end') {
            calculatedLeft = anchor.right;
          } else {
            calculatedLeft = anchor.left + anchor.width / 2;
          }
          break;
        case 'left':
          calculatedTop = top ?? anchor.top + anchor.height / 2;
          calculatedLeft = left ?? anchor.left - ANCHOR_GAP_PX;
          break;
        case 'right':
          calculatedTop = top ?? anchor.top + anchor.height / 2;
          calculatedLeft = left ?? anchor.right + ANCHOR_GAP_PX;
          break;
      }

      const transform = combineTransform(placement, align);
      menuEl.style.top = `${calculatedTop}px`;
      menuEl.style.left = `${calculatedLeft}px`;
      menuEl.style.transform = transform;

      let menuBox = menuEl.getBoundingClientRect();
      let shiftX = 0;
      if (menuBox.left < VIEWPORT_PADDING_PX) {
        shiftX = VIEWPORT_PADDING_PX - menuBox.left;
      } else if (menuBox.right > window.innerWidth - VIEWPORT_PADDING_PX) {
        shiftX = window.innerWidth - VIEWPORT_PADDING_PX - menuBox.right;
      }

      if (shiftX !== 0) {
        calculatedLeft += shiftX;
        menuEl.style.left = `${calculatedLeft}px`;
        menuBox = menuEl.getBoundingClientRect();
      }

      let shiftY = 0;
      if (menuBox.top < VIEWPORT_PADDING_PX) {
        shiftY = VIEWPORT_PADDING_PX - menuBox.top;
      } else if (menuBox.bottom > window.innerHeight - VIEWPORT_PADDING_PX) {
        shiftY = window.innerHeight - VIEWPORT_PADDING_PX - menuBox.bottom;
      }

      if (shiftY !== 0) {
        calculatedTop += shiftY;
        menuEl.style.top = `${calculatedTop}px`;
        menuBox = menuEl.getBoundingClientRect();
      }

      const anchorCenterX = anchor.left + anchor.width / 2;
      const computedArrowLeft =
        resolvedArrowOffset ??
        Math.max(
          ARROW_EDGE_INSET_PX,
          Math.min(menuBox.width - ARROW_EDGE_INSET_PX, anchorCenterX - menuBox.left),
        );

      setCoords({
        top: calculatedTop,
        left: calculatedLeft,
        arrowLeftPx: placement === 'bottom' || placement === 'top' ? computedArrowLeft : null,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef, isOpen, placement, align, top, left, resolvedArrowOffset]);

  useClickOutside([menuRef, anchorRef], onClose, { enabled: isOpen });

  if (!isOpen) return null;

  const menuStyle: CSSProperties = {
    top: `${coords.top}px`,
    left: `${coords.left}px`,
    transform: combineTransform(placement, align),
  };

  const arrowStyle: CSSProperties = {
    top: placement === 'bottom' ? '-6px' : placement === 'top' ? '100%' : '50%',
    left:
      coords.arrowLeftPx !== null
        ? `${coords.arrowLeftPx}px`
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

  return createPortal(
    <div ref={menuRef} className={menuClass} style={menuStyle}>
      <div className={styles.arrow} style={arrowStyle} aria-hidden />
      {children}
    </div>,
    document.body,
  );
}

export default FlyoutMenu;
