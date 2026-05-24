import type { FC, PointerEvent } from 'react';
import { TARGET_CARD_ICONS } from '@/config';
import { he } from '@shared/i18n';
import styles from './MapContextMenu.module.css';

/**
 * Fallback HEX colors used only when the corresponding CSS theme
 * variable is unavailable — the friend/hostile chevron in the context
 * menu renders an inline SVG that cannot pick up CSS variables.
 */
const FRIEND_HOSTILE_FALLBACKS = {
  friendlyPrimary: 'var(--color-green)',
  friendlySecondary: '#2e7d32',
  hostilePrimary: 'var(--color-red)',
  hostileSecondary: '#dc2626',
} as const;

export interface MapContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  entityId: string;
  entityName: string;
  isTarget?: boolean;
  targetIsFriend?: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAllocateTarget?: () => void;
  onDesignateTarget?: () => void;
  onToggleFriend?: () => void;
}

function stopPropagation(e: PointerEvent): void {
  e.stopPropagation();
}

export const MapContextMenu: FC<MapContextMenuProps> = ({
  open,
  x,
  y,
  isTarget = false,
  targetIsFriend = false,
  onEdit,
  onDelete,
  onAllocateTarget,
  onDesignateTarget,
  onToggleFriend,
}) => {
  if (!open) return null;

  if (isTarget) {
    const switchingToHostile = targetIsFriend;
    const actionLabel = switchingToHostile ? he.map.contextMenu.enemy : he.map.contextMenu.friend;
    const iconPrimary = switchingToHostile
      ? `var(--theme-color-danger, ${FRIEND_HOSTILE_FALLBACKS.hostilePrimary})`
      : `var(--theme-color-success, ${FRIEND_HOSTILE_FALLBACKS.friendlyPrimary})`;
    const iconSecondary = switchingToHostile
      ? `var(--color-status-fail, ${FRIEND_HOSTILE_FALLBACKS.hostileSecondary})`
      : FRIEND_HOSTILE_FALLBACKS.friendlySecondary;
    const friendButtonClass = switchingToHostile
      ? styles.actionButtonHostile
      : styles.actionButtonFriendly;

    return (
      <div
        className={styles.overlay}
        style={{ left: x, top: y }}
        onPointerDown={stopPropagation}
        role="menu"
        aria-label="Target actions"
      >
        <div className={styles.actions}>
          {(onAllocateTarget ?? onDesignateTarget) && (
            <button
              type="button"
              className={styles.actionButton}
              onPointerDown={onAllocateTarget ?? onDesignateTarget}
              aria-label={he.map.contextMenu.allocate}
            >
              <img
                src={TARGET_CARD_ICONS.allocate}
                alt=""
                className={styles.actionIcon}
              />
              <span className={styles.actionLabel}>{he.targets.allocate}</span>
            </button>
          )}

          {onToggleFriend && (
            <button
              type="button"
              className={`${styles.actionButton} ${friendButtonClass}`}
              onPointerDown={onToggleFriend}
              aria-label={switchingToHostile ? he.map.contextMenu.markEnemy : he.map.contextMenu.markFriend}
            >
              <div className={styles.friendIconWrap}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="512"
                  height="512"
                  viewBox="0 0 512 512"
                  aria-hidden
                >
                  <g transform="scale(0.9) rotate(-45 256 256)">
                    <path
                      d="M466.598 491.65 269.674 9.188a14.769 14.769 0 0 0-27.348 0L45.403 491.65a14.77 14.77 0 0 0 21.502 18.106L256 391.571l189.095 118.184A14.736 14.736 0 0 0 452.92 512a14.767 14.767 0 0 0 13.678-20.35z"
                      fill={iconPrimary}
                    />
                    <path
                      d="M445.095 509.755A14.736 14.736 0 0 0 452.92 512a14.77 14.77 0 0 0 13.677-20.351L269.674 9.187A14.77 14.77 0 0 0 256 0v391.571l189.095 118.184z"
                      fill={iconSecondary}
                    />
                  </g>
                </svg>
              </div>
              <span className={styles.actionLabel}>{actionLabel}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.entityMenu}
      style={{ left: x, top: y }}
      onPointerDown={stopPropagation}
      role="menu"
      aria-label={he.map.contextMenu.entityActions}
    >
      <button type="button" className={styles.entityButton} onPointerDown={onEdit}>
        {he.map.contextMenu.edit}
      </button>
      <button
        type="button"
        className={`${styles.entityButton} ${styles.entityButtonDanger}`}
        onPointerDown={onDelete}
      >
        {he.map.contextMenu.delete}
      </button>
    </div>
  );
};
