import { FC } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { cn } from '@shared/ui';
import { he } from '@shared/i18n';
import { setMapType } from '../store/mapSlice';
import { mapTypesSelected, type MapTypesSelector } from '@/types';
import styles from './tools/mapToolSubMenu.module.css';

interface BaseMapSelectorProps {
  onClose?: () => void;
}

type MapTypeOption = MapTypesSelector[number];

const BaseMapSelector: FC<BaseMapSelectorProps> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const selectedMapType = useAppSelector((state) => state.map.selectedMapType);

  const handleMapTypeSelect = (mapType: MapTypeOption) => {
    dispatch(setMapType(mapType.id));
    onClose?.();
  };

  return (
    <div
      className={styles.panel}
      onClick={(e) => e.stopPropagation()}
      role="menu"
      aria-label={he.mapTools.basemapMenuTitle}
    >
      <div className={styles.header}>{he.mapTools.basemapMenuTitle}</div>
      {mapTypesSelected.map((mapType) => {
        const selected = selectedMapType === mapType.id;
        return (
          <button
            key={mapType.id}
            type="button"
            onClick={() => handleMapTypeSelect(mapType)}
            className={cn(styles.row, selected && styles.rowActive)}
            title={mapType.name}
            role="menuitemradio"
            aria-checked={selected}
          >
            <span className={styles.label}>
              <span className={styles.emojiIcon} aria-hidden>
                {mapType.icon}
              </span>
              <span>{mapType.name}</span>
            </span>
            {selected ? <span className={styles.activeDot} aria-hidden /> : null}
          </button>
        );
      })}
    </div>
  );
};

export default BaseMapSelector;
