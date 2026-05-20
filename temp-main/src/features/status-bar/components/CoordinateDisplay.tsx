import { memo, useCallback } from 'react';
import type { MutableRefObject } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { selectStatusBarCoordsLabel, selectMyPositionLat, selectMyPositionLng } from '../selectors/statusBarSelectors';
import type { MapService } from '@/services/map/MapService';
import styles from './StatusBar.module.css';

export interface CoordinateDisplayProps {
  mapServiceRef: MutableRefObject<MapService | null>;
}

function CoordinateDisplay({ mapServiceRef }: CoordinateDisplayProps) {
  const coordsLabel = useAppSelector(selectStatusBarCoordsLabel);
  const posLat = useAppSelector(selectMyPositionLat);
  const posLng = useAppSelector(selectMyPositionLng);

  const handleCenterClick = useCallback(() => {
    if (posLat === 0 && posLng === 0) return;
    mapServiceRef.current?.getMap()?.panTo([posLng, posLat], { duration: 800 });
  }, [mapServiceRef, posLat, posLng]);

  return (
    <button type="button" className={styles.coordsButton} onClick={handleCenterClick}>
      <img src="./icons/pointing_center_512.png" alt="" className={styles.coordsIcon} />
      <span className={styles.coordsDivider} aria-hidden />
      <span className={styles.coordsText}>{coordsLabel}</span>
    </button>
  );
}

export default memo(CoordinateDisplay);
