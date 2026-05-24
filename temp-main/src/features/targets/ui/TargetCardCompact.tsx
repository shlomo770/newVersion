import { cn } from '@shared/ui';
import { TARGET_CARD_ICONS } from '@/config';
import { Target } from '../store/targetsSlice';
import { getTargetIcon } from '../utils/targetIconResolver';
import styles from './TargetCardCompact.module.css';

interface TargetCardCompactProps {
  target: Target;
  isSelected: boolean;
  onSelect: (targetId: string) => void;
}

export function TargetCardCompact({ target, isSelected, onSelect }: TargetCardCompactProps) {
  return (
    <div
      className={cn(styles.card, isSelected && styles.selected)}
      onClick={() => onSelect(target.id)}
      title={`${target.id} - ${target.type}`}
    >
      <div
        className={cn(styles.iconHalo, target.isRecommended && styles.iconHaloRecommended)}
      >
        <img
          src={getTargetIcon(target.type)}
          alt={target.type}
          className={styles.icon}
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.src = TARGET_CARD_ICONS.cardFallback;
          }}
        />
      </div>
      <span className={styles.label}>{target.id}</span>
    </div>
  );
}
