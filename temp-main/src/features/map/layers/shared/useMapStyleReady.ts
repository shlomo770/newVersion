import { useEffect, useRef } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';

const STYLE_DEBOUNCE_MS = 80;

/**
 * Runs `effect` when the map style is ready; debounces styledata to avoid layer flash storms.
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
    let styleTimer: ReturnType<typeof setTimeout> | null = null;
    let cleanup: void | (() => void);

    const run = () => {
      if (cancelled || !map.isStyleLoaded()) return;
      if (cleanup) cleanup();
      cleanup = effectRef.current(map);
    };

    const schedule = () => {
      if (styleTimer) clearTimeout(styleTimer);
      styleTimer = setTimeout(() => {
        styleTimer = null;
        run();
      }, STYLE_DEBOUNCE_MS);
    };

    if (map.isStyleLoaded()) {
      run();
    }

    map.on('load', run);
    map.on('styledata', schedule);

    return () => {
      cancelled = true;
      map.off('load', run);
      map.off('styledata', schedule);
      if (styleTimer) clearTimeout(styleTimer);
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
