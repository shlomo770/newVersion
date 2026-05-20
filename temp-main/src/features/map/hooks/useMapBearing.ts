import { useEffect, useState } from 'react';
import type { MapFacade } from '../services/MapFacade';

export function useMapBearing(mapFacade: MapFacade | null, mapReady: boolean): number {
  const [bearing, setBearing] = useState(0);

  useEffect(() => {
    const map = mapFacade?.getMap();
    if (!map || !mapReady) return;

    const updateBearing = () => {
      setBearing(map.getBearing());
    };

    if (map.isStyleLoaded()) {
      updateBearing();
    } else {
      const handleStyleData = () => {
        updateBearing();
        map.off('styledata', handleStyleData);
      };
      map.on('styledata', handleStyleData);
    }

    map.on('rotate', updateBearing);
    map.on('move', updateBearing);
    return () => {
      map.off('rotate', updateBearing);
      map.off('move', updateBearing);
    };
  }, [mapFacade, mapReady]);

  return bearing;
}
