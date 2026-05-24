import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type FC,
  type MutableRefObject,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { TbGps } from 'react-icons/tb';
import { useAppSelector } from '@/hooks/useAppSelector';
import { MAP_PAN_TO_DURATION_MS } from '@features/map/config';
import { STATUS_BAR_ICONS } from '@/config';
import type { MapService } from '@/services/map/MapService';
import { COORDINATE_CENTER_UI } from '../config/statusBar.config';
import {
  isValidMapCoordinate,
  selectGpsCenterCoords,
  selectHasValidGpsCenter,
  selectStatusBarDisplayCoords,
} from '../selectors/statusBarSelectors';
import styles from './CoordinateCenterMenu.module.css';

export interface CoordinateCenterMenuProps {
  anchorRef: RefObject<HTMLElement | null>;
  menuRef: RefObject<HTMLDivElement>;
  mapServiceRef: MutableRefObject<MapService | null>;
  onClose?: () => void;
}

function panMapTo(
  mapServiceRef: MutableRefObject<MapService | null>,
  lat: number,
  lng: number,
): boolean {
  if (!isValidMapCoordinate(lat, lng)) return false;
  mapServiceRef.current
    ?.getMap()
    ?.panTo([lng, lat], { duration: MAP_PAN_TO_DURATION_MS });
  return true;
}

const CoordinateCenterMenu: FC<CoordinateCenterMenuProps> = ({
  anchorRef,
  menuRef,
  mapServiceRef,
  onClose,
}) => {
  const gpsCenterCoords = useAppSelector(selectGpsCenterCoords);
  const displayCoords = useAppSelector(selectStatusBarDisplayCoords);
  const hasValidGpsCenter = useAppSelector(selectHasValidGpsCenter);
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    setMenuStyle({ top: rect.bottom + 6, left: rect.right });
  }, [anchorRef]);

  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition]);

  useEffect(() => {
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [updatePosition]);

  const handleCenterDisplay = useCallback(() => {
    if (!displayCoords) return;
    if (!panMapTo(mapServiceRef, displayCoords.lat, displayCoords.lng)) return;
    onClose?.();
  }, [displayCoords, mapServiceRef, onClose]);

  const handleCenterGps = useCallback(() => {
    if (!gpsCenterCoords) return;
    if (!panMapTo(mapServiceRef, gpsCenterCoords.lat, gpsCenterCoords.lng)) return;
    onClose?.();
  }, [gpsCenterCoords, mapServiceRef, onClose]);

  return createPortal(
    <div
      ref={menuRef}
      className={styles.panel}
      style={{ top: menuStyle.top, left: menuStyle.left }}
      onPointerDown={(e) => e.stopPropagation()}
      role="menu"
    >
      <button
        type="button"
        className={styles.iconAction}
        onClick={handleCenterDisplay}
        disabled={!displayCoords}
        title={COORDINATE_CENTER_UI.display.title}
        aria-label={COORDINATE_CENTER_UI.display.ariaLabel}
        role="menuitem"
      >
        <img src={STATUS_BAR_ICONS.coordinatesCenter} alt="" className={styles.iconGlyph} />
      </button>
      <button
        type="button"
        className={styles.iconAction}
        onClick={handleCenterGps}
        disabled={!hasValidGpsCenter}
        title={COORDINATE_CENTER_UI.gps.title}
        aria-label={COORDINATE_CENTER_UI.gps.ariaLabel}
        role="menuitem"
      >
        <TbGps size={20} className={styles.gpsIcon} aria-hidden />
      </button>
    </div>,
    document.body,
  );
};

export default CoordinateCenterMenu;
