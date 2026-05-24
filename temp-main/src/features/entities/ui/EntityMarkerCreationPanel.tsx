import { FC } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { setCreationForm, setSelectedMarkerIcon } from '@features/entities/store/entitiesSlice';
import { setDrawingMode } from '@features/map';
import { MARKER_ICONS, getMarkerIconChar } from '@/constants/markerIcons';
import { EntityCategoryEnum } from '@domain/enums/entity.enum';
import { AppButton, AppFloatingPanel, AppInput, AppSectionTitle, cn } from '@shared/ui';
import { he } from '@shared/i18n';
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
    const name = creationName?.trim() || he.entities.panels.defaultMarkerName;
    dispatch(setCreationForm({ name, category: EntityCategoryEnum.FREE, height: creationHeight }));
    dispatch(setDrawingMode('marker'));
    onClose();
  };

  return (
    <AppFloatingPanel open={isOpen} onClose={handleClose} title={he.entities.panels.markerCreationTitle} position="left">
      <div className={styles.stack}>
        <p className={styles.hint}>{he.entities.panels.markerHint}</p>

        <AppInput
          compact
          label={he.entities.panels.name}
          value={creationName}
          onChange={(e) =>
            dispatch(setCreationForm({ name: e.target.value, category: EntityCategoryEnum.FREE, height: creationHeight }))
          }
          placeholder={he.entities.panels.namePlaceholder}
        />

        <div>
          <AppSectionTitle>{he.entities.panels.markerIcon}</AppSectionTitle>
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
          {he.entities.panels.drawMarkerOnMap}
        </AppButton>
      </div>
    </AppFloatingPanel>
  );
};

export default EntityMarkerCreationPanel;
