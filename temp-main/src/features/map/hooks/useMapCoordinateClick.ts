import { useCallback, useEffect } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { updateClickCord } from '@features/platform';
import { attachUnifiedMapClick, detachUnifiedMapClick } from '@/utils/mapEvents';
import type { MapFacade } from '../services/MapFacade';

interface MapClickEvent {
  lngLat: { lat: number; lng: number };
}

type UseMapCoordinateClickParams = {
  mapFacade: MapFacade | null;
  drawingMode: string | null;
  isMeasuring: boolean;
};

export function useMapCoordinateClick({
  mapFacade,
  drawingMode,
  isMeasuring,
}: UseMapCoordinateClickParams) {
  const dispatch = useAppDispatch();

  const handleClick = useCallback(
    (e: MapClickEvent) => {
      if (!drawingMode && !isMeasuring) {
        const existingButton = document.getElementById('marker-button');
        if (existingButton) existingButton.remove();
      }
      dispatch(updateClickCord({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
    },
    [drawingMode, isMeasuring, dispatch],
  );

  useEffect(() => {
    const map = mapFacade?.getMap();
    if (!map) return;
    const wrappedClickHandler = attachUnifiedMapClick(map, handleClick);
    return () => {
      detachUnifiedMapClick(map, wrappedClickHandler);
    };
  }, [mapFacade, handleClick]);
}
