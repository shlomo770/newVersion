import { FC } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { setCreationForm, setDrawingMode, setSelectedMarkerIcon } from '@features/entities/store/entitiesSlice';
import { MARKER_ICONS, getMarkerIconChar } from '@/constants/markerIcons';
import { EntityCategoryEnum } from '@domain/enums/entity.enum';
import { AppButton, AppFloatingPanel, AppInput, AppSectionTitle, cn } from '@shared/ui';
import styles from './EntityMarkerCreationPanel.module.css';

interface EntityMarkerCreationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const EntityMarkerCreationPanel: FC<EntityMarkerCreationPanelProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const creationName = useAppSelector((s) => s.entities.creationName);
  const creationHeight = useAppSelector((s) => s.entities.creationHeight);
  const selectedIcon = useAppSelector((s) => s.entities.selectedMarkerIcon);

  const handleClose = () => {
    dispatch(setCreationForm({ name: '', category: EntityCategoryEnum.FREE, height: 0 }));
    dispatch(setSelectedMarkerIcon(null));
    onClose();
  };

  const handleSelectIcon = (code: string) => {
    dispatch(setSelectedMarkerIcon(code));
  };

  const handleStartDrawing = () => {
    if (!selectedIcon) return;
    const name = creationName?.trim() || 'נקודה';
    dispatch(setCreationForm({ name, category: EntityCategoryEnum.FREE, height: creationHeight }));
    dispatch(setDrawingMode('marker'));
    onClose();
  };

  return (
    <AppFloatingPanel open={isOpen} onClose={handleClose} title="נקודה חדשה" position="left">
      <div className={styles.stack}>
        <p className={styles.hint}>שם · אייקון קטן · ציור במפה</p>

        <AppInput
          compact
          label="שם"
          value={creationName}
          onChange={(e) =>
            dispatch(setCreationForm({ name: e.target.value, category: EntityCategoryEnum.FREE, height: creationHeight }))
          }
          placeholder="שם הנקודה…"
        />

        <div>
          <AppSectionTitle>אייקון</AppSectionTitle>
          <div className={styles.grid}>
            {MARKER_ICONS.map(({ code, label, font }) => {
              const isSelected = selectedIcon === code;
              return (
                <button
                  key={code}
                  type="button"
                  className={cn(styles.iconOption, isSelected && styles.iconOptionSelected)}
                  onClick={() => handleSelectIcon(code)}
                  title={label}
                >
                  <span className={styles.iconGlyph} style={{ fontFamily: `${font}, sans-serif` }}>
                    {getMarkerIconChar(code)}
                  </span>
                  <span className={styles.iconLabel}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <AppButton fullWidth disabled={!selectedIcon} onClick={handleStartDrawing}>
          ציור נקודה במפה
        </AppButton>
      </div>
    </AppFloatingPanel>
  );
};

export default EntityMarkerCreationPanel;
