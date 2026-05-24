import { memo, useCallback } from 'react';
import type { MutableRefObject } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { selectStatusBarCoordsLabel, selectMyPositionLat, selectMyPositionLng } from '../selectors/statusBarSelectors';
import type { MapService } from '@/services/map/MapService';
import { STATUS_BAR_ICONS } from '@/config';
import { MAP_PAN_TO_DURATION_MS } from '@features/map/config';
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
    mapServiceRef.current
      ?.getMap()
      ?.panTo([posLng, posLat], { duration: MAP_PAN_TO_DURATION_MS });
  }, [mapServiceRef, posLat, posLng]);

  return (
    <button type="button" className={styles.coordsButton} onClick={handleCenterClick}>
      <img src={STATUS_BAR_ICONS.coordinatesCenter} alt="" className={styles.coordsIcon} />
      <span className={styles.coordsDivider} aria-hidden />
      <span className={styles.coordsText}>{coordsLabel}</span>
    </button>
  );
}

export default memo(CoordinateDisplay);
