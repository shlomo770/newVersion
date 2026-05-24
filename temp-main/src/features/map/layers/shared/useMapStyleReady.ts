import { useEffect, useRef } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';

/**
 * Runs `effect` once the map style is loaded, and again after a full style reload (`load`).
 * Does NOT re-run on tile `styledata` events — those fire constantly during pan/zoom and must
 * not tear down or reinstall custom sources/layers.
 */
export function useMapStyleReady(
  map: MaplibreMap | null,
  effect: (map: MaplibreMap) => void | (() => void),
  deps: readonly unknown[],
): void {
  const effectRef = useRef(effect);
  effectRef.current = effect;

  useEffect(() => {
    if (!map) return undefined;

    let cancelled = false;
    let cleanup: void | (() => void);

    const run = () => {
      if (cancelled || !map.isStyleLoaded()) return;
      cleanup = effectRef.current(map);
    };

    if (map.isStyleLoaded()) {
      run();
    }

    map.on('load', run);

    return () => {
      cancelled = true;
      map.off('load', run);
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies domain deps
  }, [map, ...deps]);
}

export function safeRemoveLayer(map: MaplibreMap, layerId: string): void {
  try {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  } catch {
    /* style may be rebuilding */
  }
}

export function safeRemoveSource(map: MaplibreMap, sourceId: string): void {
  try {
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  } catch {
    /* style may be rebuilding */
  }
}
