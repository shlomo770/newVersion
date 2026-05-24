import { IoClose } from 'react-icons/io5';
import { Target, sortByType } from '../store/targetsSlice';
import { TargetCardCompact } from './TargetCardCompact';
import { TargetCardExpanded } from './TargetCardExpanded';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { AppIconButton, cn } from '@shared/ui';
import styles from './TargetListPanel.module.css';

interface TargetListPanelProps {
  targets: Target[];
  selectedTargetId: string | null;
  viewMode: 'compact' | 'expanded';
  onSelectTarget: (targetId: string) => void;
  onAction: (targetId: string) => void;
  onCenter: (targetId: string) => void;
  onAbort: (targetId: string) => void;
  onToggleViewMode: () => void;
  onClose: () => void;
}

export function TargetListPanel({
  targets,
  selectedTargetId,
  viewMode,
  onSelectTarget,
  onAction,
  onCenter,
  onAbort,
  onToggleViewMode,
  onClose,
}: TargetListPanelProps) {
  const effectiveSelectedId = selectedTargetId ?? targets[0]?.id ?? null;
  const dispatch = useAppDispatch();

  const renderHeader = (label: string, viewToggleLabel: string) => (
    <div className={cn(styles.toolbar, viewMode === 'expanded' && styles.toolbarExpanded)}>
      <div className={styles.toolbarSection}>
        <button
          type="button"
          onClick={() => dispatch(sortByType())}
          className={styles.toolbarButton}
          title={label}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M3 4h18l-7 9v5l-4 2v-7L3 4z" />
          </svg>
          <span>{label}</span>
        </button>
      </div>
      <div className={styles.toolbarSection}>
        <button
          type="button"
          onClick={onToggleViewMode}
          className={styles.toggleButton}
          title="Toggle view"
          aria-label="Toggle view"
        >
          {viewToggleLabel}
        </button>
        <AppIconButton
          size="sm"
          onClick={onClose}
          label="הסתר פאנל מטרות"
          className={styles.hideButton}
        >
          <IoClose size={18} />
        </AppIconButton>
      </div>
    </div>
  );

  return (
    <div className={styles.dock} data-targets-dock>
      <div
        className={cn(
          styles.scroll,
          viewMode === 'compact' ? styles.scrollCompact : styles.scrollExpanded,
        )}
      >
        {viewMode === 'compact' ? (
          <div>
            {targets[0] ? (
              <TargetCardExpanded
                target={targets[0]}
                onAction={onAction}
                onCenter={onCenter}
                onAbort={onAbort}
              />
            ) : null}
            {targets[1] ? (
              <TargetCardExpanded
                target={targets[1]}
                onAction={onAction}
                onCenter={onCenter}
                onAbort={onAbort}
              />
            ) : null}

            {renderHeader('Sort by type', '>>')}

            <div className={styles.compactGrid}>
              {targets.map((target) => (
                <div key={target.id} className={styles.compactCell}>
                  <TargetCardCompact
                    target={target}
                    isSelected={target.id === effectiveSelectedId}
                    onSelect={onSelectTarget}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.expandedList}>
            {renderHeader('מיון לפי סוג', '<<')}
            {targets.map((target) => (
              <TargetCardExpanded
                key={target.id}
                target={target}
                onAction={onAction}
                onCenter={onCenter}
                onAbort={onAbort}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
