import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import { useAppSelector } from '@/hooks/useAppSelector';
import type { Target } from '@features/targets';
import {
  isTargetIconId,
  loadAllTargetIcons,
  loadTargetIconIntoMap,
} from './mapTargetIconLoader';
import {
  installTargetLayers,
  verifyTargetLayersInstalled,
} from './targetLayerInstaller';
import { pushTargetData } from './targetLayerUpdater';
import { MAP_PRELOAD_TARGET_ICON_IDS } from '@features/targets/utils/targetIconResolver';
import { isAbortableTarget } from '@features/targets/utils/targetAbortRule';
import { registerOwnedMapImageIds } from '@features/map/utils/mapErrorHandler';
import { isTargetVisibleByFilter } from '../shared/targetVisibility';
import { AppButton } from '@shared/ui';
import {
  ABORT_BUTTON_WIDTH_PX,
  getAbortButtonScreenPosition,
} from './abortButtonLayout';
import {
  TARGET_LAYER_IDS,
  TARGETS_INIT_CONFIG,
  TARGETS_RECOMMENDED_BLINK,
} from '@features/map/config';
import styles from './TargetsLayer.module.css';

/**
 * TargetsLayer — thin React orchestrator.
 *
 * All the heavy lifting lives in dedicated modules so this file stays
 * focused on lifecycle + Redux wiring:
 *
 *   - `targetLayerInstaller.ts` — addSource / addLayer (idempotent).
 *   - `targetLayerUpdater.ts`   — source.setData (cheap, every frame).
 *   - `targetGeoJson.ts`        — pure FeatureCollection builders.
 *   - `mapTargetIconLoader.ts`  — SVG → ImageData rasterization.
 *   - `targetIconResolver.ts`   — type → icon id.
 *   - `targetLabel.ts`          — on-map text label formatting.
 *   - `targetAbortRule.ts`      — which targets get an ABORT button.
 *
 * The component does five things and nothing else:
 *
 *   1. Reads targets / filters / jeep position from Redux.
 *   2. Drives the bulletproof init lifecycle (initial delay + load +
 *      styledata + periodic retry until installer succeeds AND
 *      sanity-check passes).
 *   3. Re-runs `pushTargetData` whenever visible targets or jeep change.
 *   4. Flips `setLayoutProperty('visibility', …)` when the user toggles
 *      trails / labels — layers are never recreated for visibility.
 *   5. Renders the DOM ABORT-button overlay synced to the MapLibre
 *      viewport.
 */

interface TargetsLayerProps {
  map: MaplibreMap;
  onAbort: (targetId: string) => void;
}

function isMapReady(map: MaplibreMap | null): boolean {
  return !!map && typeof map.isStyleLoaded === 'function' && Boolean(map.isStyleLoaded());
}

const TargetsLayer: React.FC<TargetsLayerProps> = ({ map, onAbort }) => {
  const targets = useAppSelector((state) => state.targets);
  const targetFilters = useAppSelector((state) => state.filter.targets);
  /* Defensive against an older slice shape that may still be in the
   * running Redux store across HMR — `targetVisibility` could be undefined. */
  const trailsVisible = useAppSelector(
    (state) => state.filter.targetVisibility?.trails ?? true,
  );
  const labelsVisible = useAppSelector(
    (state) => state.filter.targetVisibility?.labels ?? true,
  );
  const myPosition = useAppSelector((state) => state.myPosition);

  /* Refs for the initial layer install — keeps `initialize` stable
   * across visibility-toggle re-renders. The toggle effects below
   * handle live visibility updates via `setLayoutProperty`. */
  const trailsVisibleRef = useRef(trailsVisible);
  trailsVisibleRef.current = trailsVisible;
  const labelsVisibleRef = useRef(labelsVisible);
  labelsVisibleRef.current = labelsVisible;

  const initializedRef = useRef(false);
  /* State flag (not just a ref) so the data-push effect re-runs the
   * moment init flips to true. */
  const [initialized, setInitialized] = useState(false);
  /* Always holds the LATEST `pushData` closure so deferred callers
   * (the `initialize().then(...)` continuation) push fresh data. */
  const pushDataRef = useRef<() => void>(() => undefined);

  const visibleTargets = useMemo(() => {
    const all = targets.allIds
      .map((id) => targets.byId[id])
      .filter((t): t is Target => Boolean(t));
    return all.filter((t) => isTargetVisibleByFilter(t, targetFilters));
  }, [targets.allIds, targets.byId, targetFilters]);

  /* Reserve icon ids globally so mapErrorHandler doesn't shadow them
   * with 1×1 transparent placeholders when MapLibre fires
   * `styleimagemissing`. */
  useEffect(() => {
    return registerOwnedMapImageIds(MAP_PRELOAD_TARGET_ICON_IDS, isTargetIconId);
  }, []);

  /* Lazy load fallback — covers the case where a target arrives with
   * an icon id we somehow haven't preloaded yet. */
  useEffect(() => {
    const handler = (event: { id: string }) => {
      if (!isTargetIconId(event.id)) return;
      if (map.hasImage(event.id)) return;
      void loadTargetIconIntoMap(map, event.id).then((ok) => {
        if (ok) map.triggerRepaint();
      });
    };
    map.on('styleimagemissing', handler);
    return () => {
      map.off('styleimagemissing', handler);
    };
  }, [map]);

  /**
   * Idempotent initialize — loads all icons, then delegates to the
   * installer, then verifies the layer is actually queryable.
   */
  const initialize = useCallback(async (): Promise<boolean> => {
    if (!isMapReady(map)) return false;
    if (initializedRef.current) return true;

    /* Preload all icon images BEFORE adding the symbol layer. MapLibre's
     * placement loop will crash on every frame otherwise. */
    await loadAllTargetIcons(map);

    /* IMPORTANT: do NOT re-check `isStyleLoaded()` here. While icons
     * were rasterizing (~100ms) the map may have started loading
     * tiles and `isStyleLoaded()` will return false intermittently.
     * After the initial load fired once, `addSource` / `addLayer`
     * work fine even while tiles are in flight. */

    try {
      installTargetLayers(map, {
        trailsVisible: trailsVisibleRef.current,
        labelsVisible: labelsVisibleRef.current,
      });

      if (!verifyTargetLayersInstalled(map)) {
        return false;
      }

      initializedRef.current = true;
      return true;
    } catch {
      return false;
    }
  }, [map]);

  const pushData = useCallback(() => {
    if (!map || !initializedRef.current) return;
    pushTargetData(map, {
      visibleTargets,
      jeep: myPosition?.coordinates,
    });
  }, [map, visibleTargets, myPosition]);

  /* Keep the ref pointing at the latest closure. */
  pushDataRef.current = pushData;

  /**
   * Bulletproof init lifecycle. Three independent triggers funnel
   * through one idempotent `attempt()`:
   *
   *   1. Scheduled first attempt after `initialDelayMs`.
   *   2. `load` event.
   *   3. `styledata` event.
   *   4. Periodic retry safety net every `retryIntervalMs`,
   *      capped at `maxAttempts`. `attempt()` stops the interval
   *      itself on success.
   *
   * The watchdog at the top of `attempt()` rebuilds layers if a
   * basemap swap dropped them.
   */
  useEffect(() => {
    if (!map) return;
    let cancelled = false;
    let pending = false;
    let attempts = 0;
    let interval: number | null = null;
    let initialTimer: number | null = null;

    const stopRetries = () => {
      if (interval !== null) {
        window.clearInterval(interval);
        interval = null;
      }
    };

    const attempt = async () => {
      if (cancelled || pending) return;

      if (initializedRef.current) {
        if (!map.getLayer(TARGET_LAYER_IDS.icons)) {
          initializedRef.current = false;
          setInitialized(false);
        } else {
          stopRetries();
          return;
        }
      }

      if (!map.isStyleLoaded()) return;

      attempts += 1;
      if (attempts > TARGETS_INIT_CONFIG.maxAttempts) {
        stopRetries();
        return;
      }

      pending = true;
      try {
        const ok = await initialize();
        pending = false;
        if (cancelled) return;
        if (ok) {
          setInitialized(true);
          pushDataRef.current();
          stopRetries();
        }
      } catch {
        pending = false;
      }
    };

    initialTimer = window.setTimeout(() => {
      void attempt();
    }, TARGETS_INIT_CONFIG.initialDelayMs) as unknown as number;

    const onLoad = () => {
      void attempt();
    };
    const onStyleData = () => {
      void attempt();
    };
    map.on('load', onLoad);
    map.on('styledata', onStyleData);

    interval = window.setInterval(() => {
      void attempt();
    }, TARGETS_INIT_CONFIG.retryIntervalMs) as unknown as number;

    return () => {
      cancelled = true;
      if (initialTimer !== null) window.clearTimeout(initialTimer);
      stopRetries();
      map.off('load', onLoad);
      map.off('styledata', onStyleData);
    };
  }, [map, initialize]);

  /* Re-push data on every visible target / jeep change. Gated on the
   * `initialized` STATE so it re-fires the moment init flips to true. */
  useEffect(() => {
    if (!initialized) return;
    pushData();
  }, [initialized, pushData, visibleTargets.length]);

  /* Visibility toggles — flip layout property only, never recreate. */
  useEffect(() => {
    try {
      if (map.getLayer(TARGET_LAYER_IDS.trails)) {
        map.setLayoutProperty(
          TARGET_LAYER_IDS.trails,
          'visibility',
          trailsVisible ? 'visible' : 'none',
        );
      }
    } catch {
      /* not ready */
    }
  }, [map, trailsVisible]);

  useEffect(() => {
    try {
      if (map.getLayer(TARGET_LAYER_IDS.labels)) {
        map.setLayoutProperty(
          TARGET_LAYER_IDS.labels,
          'visibility',
          labelsVisible ? 'visible' : 'none',
        );
      }
    } catch {
      /* not ready */
    }
  }, [map, labelsVisible]);

  /* Recommended ring blink — config-driven cadence + opacities. */
  useEffect(() => {
    let visible = true;
    const interval = window.setInterval(() => {
      try {
        if (!map.getLayer(TARGET_LAYER_IDS.ringRecommended)) return;
        map.setPaintProperty(
          TARGET_LAYER_IDS.ringRecommended,
          'circle-stroke-opacity',
          visible ? TARGETS_RECOMMENDED_BLINK.opacityOn : TARGETS_RECOMMENDED_BLINK.opacityOff,
        );
        visible = !visible;
      } catch {
        /* not ready */
      }
    }, TARGETS_RECOMMENDED_BLINK.intervalMs);
    return () => window.clearInterval(interval);
  }, [map]);

  /* Abort buttons (DOM overlay anchored to MapLibre screen coords). */
  const [buttons, setButtons] = useState<Record<string, { x: number; y: number }>>({});
  const updateButtonPos = useCallback(() => {
    const result: Record<string, { x: number; y: number }> = {};
    for (const t of visibleTargets) {
      if (isAbortableTarget(t) && t.coordinates) {
        result[t.id] = getAbortButtonScreenPosition(
          map,
          t.coordinates.lng,
          t.coordinates.lat,
        );
      }
    }
    setButtons(result);
  }, [map, visibleTargets]);

  useEffect(() => {
    updateButtonPos();
    map.on('move', updateButtonPos);
    map.on('zoom', updateButtonPos);
    map.on('rotate', updateButtonPos);
    map.on('pitch', updateButtonPos);
    return () => {
      map.off('move', updateButtonPos);
      map.off('zoom', updateButtonPos);
      map.off('rotate', updateButtonPos);
      map.off('pitch', updateButtonPos);
    };
  }, [map, updateButtonPos]);

  const abortableTargets = visibleTargets.filter(isAbortableTarget);

  return (
    <>
      {abortableTargets.map((t) => {
        const pos = buttons[t.id];
        if (!pos) return null;
        return (
          <div
            key={t.id}
            className={styles.abortAnchor}
            style={{
              left: pos.x,
              top: pos.y,
              width: ABORT_BUTTON_WIDTH_PX,
            }}
          >
            <AppButton
              variant="danger"
              size="sm"
              className={styles.abortButton}
              onClick={() => onAbort(t.id)}
            >
              ביטול
            </AppButton>
          </div>
        );
      })}
    </>
  );
};

export default TargetsLayer;
