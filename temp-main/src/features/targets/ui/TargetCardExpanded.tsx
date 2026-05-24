import { TargetStateString } from '@domain/enums/target.enum';
import { cn } from '@shared/ui';
import { TARGET_CARD_ICONS } from '@/config';
import {
  getTargetStatusHebrewLabel,
  getTargetTypeHebrewLabel,
} from '@features/targets/config';
import { Target } from '../store/targetsSlice';
import { getTargetIcon } from '../utils/targetIconResolver';
import { ImageButtonGhost } from '@shared/components/buttons/ImageButtonGhost';
import { RedRoundButton } from '@shared/components/buttons/RedRoundButton';
import { SpinnerMustard } from '@shared/components/feedback/Spinner';
import { he } from '@shared/i18n';
import styles from './TargetCardExpanded.module.css';

interface TargetCardExpandedProps {
  target: Target;
  onAction: (targetId: string) => void;
  onCenter: (targetId: string) => void;
  onAbort: (targetId: string) => void;
}

/** Component-local sizing for the in-card action buttons. These are
 *  intentionally NOT moved to a global config because they're tied to
 *  the card layout (sm/md/lg button slots in `TargetCardExpanded.module.css`). */
const ACTION_BUTTON_SIZES = {
  allocateImage: 55,
  abortRound: 65,
  destroyedImage: 50,
  spinner: 60,
  spinnerStroke: 6,
} as const;

export function TargetCardExpanded({
  target,
  onAction,
  onCenter,
  onAbort,
}: TargetCardExpandedProps) {
  if (target === undefined) return null;

  const isHighlighted = target.status !== TargetStateString.active;
  const isTrackLike =
    target.status === TargetStateString.track ||
    target.status === TargetStateString.designated ||
    target.status === TargetStateString.arm;

  return (
    <div className={cn(styles.card, isHighlighted && styles.cardHighlighted)}>
      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={styles.iconColumn}>
            <div
              className={cn(
                styles.iconWrap,
                isTrackLike && styles.iconWrapTrack,
                target.isRecommended && styles.iconWrapRecommended,
              )}
            >
              <img
                onClick={() => onCenter(target.id)}
                src={getTargetIcon(target.type)}
                alt={target.type}
                className={styles.icon}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = TARGET_CARD_ICONS.cardFallback;
                }}
              />
            </div>
            <div className={styles.metricsRow}>
              <div className={styles.metrics}>
                <div className={styles.metric}>Rng {target.range?.toString().slice(0, 4)} m</div>
                <div className={styles.metric}>
                  Az {Math.floor(Number(target.heading?.toString().slice(0, 4)))} °
                </div>
              </div>
              <div className={styles.divider} />
            </div>
          </div>

          <div className={styles.info}>
            <div className={styles.targetId}>{target.id}</div>
            <div className={styles.targetType}>{getTargetTypeHebrewLabel(target.type)}</div>
            <div className={styles.metric}>{target.speed} m</div>
            <div className={styles.metric}>{target.coordinates.alt?.toString().slice(0, 4)} kts</div>
          </div>
        </div>

        <div className={styles.actionsColumn}>
          <div className={styles.status}>{getTargetStatusHebrewLabel(target.status)}</div>
          {target.status === TargetStateString.active && (
            <div>
              <ImageButtonGhost
                onClick={() => onAction(target.id)}
                size={ACTION_BUTTON_SIZES.allocateImage}
                src={TARGET_CARD_ICONS.allocate}
              />
              <div className={styles.actionLabel}>{he.targets.allocate}</div>
            </div>
          )}
          {target.status === TargetStateString.designated && (
            <RedRoundButton
              onClick={() => onAbort(target.id)}
              size={ACTION_BUTTON_SIZES.abortRound}
              label={he.targets.cancel}
            />
          )}
          {(target.status === TargetStateString.track ||
            target.status === TargetStateString.arm) && (
            <RedRoundButton
              onClick={() => onAbort(target.id)}
              size={ACTION_BUTTON_SIZES.abortRound}
              label={he.targets.cancel}
            />
          )}
          {target.status === TargetStateString.allocated && (
            <div>
              <div className={styles.waitingAction}>
                <SpinnerMustard
                  size={ACTION_BUTTON_SIZES.spinner}
                  stroke={ACTION_BUTTON_SIZES.spinnerStroke}
                  className={styles.waitingSpinner}
                />
                <button
                  type="button"
                  className={styles.waitingAbortBtn}
                  onClick={() => onAbort(target.id)}
                  aria-label={he.targets.cancel}
                  title={he.targets.cancel}
                >
                  {he.targets.cancel}
                </button>
              </div>
              <div className={styles.actionLabel}>{he.targets.pending}</div>
            </div>
          )}
          {target.status === TargetStateString.destroyed && (
            <div>
              <ImageButtonGhost
                size={ACTION_BUTTON_SIZES.destroyedImage}
                src={TARGET_CARD_ICONS.destroyed}
              />
              <div className={styles.actionLabel}>{he.targets.destroyed}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
