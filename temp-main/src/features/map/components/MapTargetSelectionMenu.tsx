import type { FC, PointerEvent } from 'react';
import styles from './MapTargetSelectionMenu.module.css';

export interface MapTargetMenuEntry {
  id: string;
  type: string;
  friend: boolean;
}

export interface MapTargetSelectionMenuProps {
  open: boolean;
  x: number;
  y: number;
  targets: MapTargetMenuEntry[];
  onClose: () => void;
  onSelectTarget: (targetId: string) => void;
}

function stopPropagation(e: PointerEvent): void {
  e.stopPropagation();
}

export const MapTargetSelectionMenu: FC<MapTargetSelectionMenuProps> = ({
  open,
  x,
  y,
  targets,
  onClose,
  onSelectTarget,
}) => {
  if (!open || targets.length === 0) return null;

  return (
    <>
      <div
        className={styles.backdrop}
        onPointerDown={() => {
          window.setTimeout(onClose, 100);
        }}
        aria-hidden
      />
      <div
        className={styles.panel}
        style={{ left: x, top: y }}
        onPointerDown={stopPropagation}
        role="listbox"
        aria-label="Select target"
      >
        <div className={styles.header}>Select Target</div>
        {targets.map((target) => (
          <button
            key={target.id}
            type="button"
            className={styles.item}
            onPointerDown={() => onSelectTarget(target.id)}
          >
            <span className={target.friend ? styles.dotFriendly : styles.dotHostile} />
            <span className="font-medium">{target.id}</span>
            <span className={styles.typeHint}>({target.type})</span>
          </button>
        ))}
      </div>
    </>
  );
};
