import { useEffect, useState } from 'react';
import type { Coordinates } from '@domain/models/coordinates';
import type { MapFacade } from '../services/MapFacade';

export function useOverlayScreenPosition(
  mapFacade: MapFacade | null,
  anchor: Coordinates | undefined,
): { x: number; y: number } | null {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const map = mapFacade?.getMap();
    if (!map || !anchor) {
      setPos(null);
      return;
    }

    const updatePos = () => {
      const projected = mapFacade?.projectToScreen(anchor.lng, anchor.lat);
      setPos(projected ?? null);
    };

    updatePos();
    map.on('move', updatePos);
    map.on('zoom', updatePos);
    map.on('rotate', updatePos);
    return () => {
      map.off('move', updatePos);
      map.off('zoom', updatePos);
      map.off('rotate', updatePos);
    };
  }, [mapFacade, anchor?.lng, anchor?.lat]);

  return pos;
}
