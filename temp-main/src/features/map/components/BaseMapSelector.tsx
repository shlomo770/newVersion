import { FC } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { cn } from '@shared/ui';
import { setMapType } from '../store/mapSlice';
import { mapTypesSelected, type MapTypesSelector } from '@/types';
import styles from './BaseMapSelector.module.css';

interface BaseMapSelectorProps {
  isOpen: boolean;
  onToggle: () => void;
}

type MapTypeOption = MapTypesSelector[number];

const BaseMapSelector: FC<BaseMapSelectorProps> = ({ isOpen, onToggle }) => {
  const dispatch = useAppDispatch();
  const selectedMapType = useAppSelector((state) => state.map.selectedMapType);

  const handleMapTypeSelect = (mapType: MapTypeOption) => {
    dispatch(setMapType(mapType.id));
    onToggle();
  };

  return (
    <div className={styles.menu}>
      {isOpen ? (
        <div className={styles.dropdown} onPointerDown={(e) => e.stopPropagation()}>
          <div className={styles.list}>
            {mapTypesSelected.map((mapType) => {
              const selected = selectedMapType === mapType.id;
              return (
                <button
                  key={mapType.id}
                  type="button"
                  onPointerDown={() => handleMapTypeSelect(mapType)}
                  className={cn(styles.option, selected && styles.optionSelected)}
                >
                  <span className={styles.icon}>{mapType.icon}</span>
                  <span className={styles.name}>{mapType.name}</span>
                  {selected ? (
                    <svg className={styles.check} fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BaseMapSelector;
