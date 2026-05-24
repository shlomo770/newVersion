import type { Map as MaplibreMap } from 'maplibre-gl';
import {
  TARGET_ASSIGNMENT_ALLOCATED_PAINT,
  TARGET_ASSIGNMENT_ASSIGNED_PAINT,
  TARGET_ASSIGNMENT_LOCKED_PAINT,
  TARGET_DESTROYED_ICON_SIZE,
  TARGET_ICON_SIZE_BY_ZOOM,
  TARGET_LABEL_LAYOUT,
  TARGET_LABEL_PAINT,
  TARGET_LAYER_IDS,
  TARGET_RING_RECOMMENDED_PAINT,
  TARGET_RING_RED_PAINT,
  TARGET_SOURCE_IDS,
  TARGET_TRAIL_PAINT,
} from '@features/map/config';
import { TARGET_DESTROYED_ICON_ID } from '@features/targets/config';

/**
 * Idempotent installer for every MapLibre source + layer the targets
 * feature owns.
 *
 * Splits cleanly from the React component so the install logic is
 * exercisable in isolation and from any future code path that may need
 * to reinstall layers after a basemap swap.
 *
 * Invariants enforced here (in install order):
 *   1. All four GeoJSON sources are created with empty FeatureCollections.
 *   2. Trails (line) come first — purely cosmetic, no symbol bucket.
 *   3. Target icon symbol layer is the FIRST symbol-typed layer added.
 *      Adding text-symbol layers before any icon-symbol has crashed
 *      `continuePlacement` in some MapLibre versions.
 *   4. Destroyed-X symbol layer second.
 *   5. Status rings (circle).
 *   6. Assignment lines — added BEFORE the icon layer (visually behind).
 *   7. Labels LAST.
 *
 * After install, `verifyTargetLayersInstalled` does a paranoid round
 * trip through `getSource`/`getLayer` to catch the "addLayer succeeded
 * silently but layer isn't queryable" race.
 */

const EMPTY_FC: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

export interface InstallTargetLayersOptions {
  /** Initial `visibility` for the trails layer — Redux state at mount. */
  trailsVisible: boolean;
  /** Initial `visibility` for the labels layer — Redux state at mount. */
  labelsVisible: boolean;
}

/** Add a source only if it doesn't already exist. */
function ensureSource(
  map: MaplibreMap,
  id: string,
  spec: { type: 'geojson'; data: GeoJSON.FeatureCollection },
): void {
  if (!map.getSource(id)) {
    map.addSource(id, spec);
  }
}

/** Add a layer only if it doesn't already exist. */
function ensureLayer(
  map: MaplibreMap,
  layer: Parameters<MaplibreMap['addLayer']>[0],
  beforeId?: string,
): void {
  if (!map.getLayer(layer.id)) {
    map.addLayer(layer, beforeId);
  }
}

export function installTargetLayers(
  map: MaplibreMap,
  options: InstallTargetLayersOptions,
): void {
  /* 1. Sources */
  ensureSource(map, TARGET_SOURCE_IDS.targets, { type: 'geojson', data: EMPTY_FC });
  ensureSource(map, TARGET_SOURCE_IDS.trails, { type: 'geojson', data: EMPTY_FC });
  ensureSource(map, TARGET_SOURCE_IDS.assignmentLines, {
    type: 'geojson',
    data: EMPTY_FC,
  });
  ensureSource(map, TARGET_SOURCE_IDS.assignmentTips, {
    type: 'geojson',
    data: EMPTY_FC,
  });

  /* 2. Trails */
  ensureLayer(map, {
    id: TARGET_LAYER_IDS.trails,
    type: 'line',
    source: TARGET_SOURCE_IDS.trails,
    layout: { visibility: options.trailsVisible ? 'visible' : 'none' },
    paint: TARGET_TRAIL_PAINT,
  });

  /* 3. Target icons (FIRST symbol layer) */
  ensureLayer(map, {
    id: TARGET_LAYER_IDS.icons,
    type: 'symbol',
    source: TARGET_SOURCE_IDS.targets,
    filter: ['!=', ['get', 'isDestroyed'], true],
    layout: {
      'icon-image': ['get', 'iconId'],
      ...TARGET_ICON_SIZE_BY_ZOOM,
    },
  });

  /* 4. Destroyed-X */
  ensureLayer(map, {
    id: TARGET_LAYER_IDS.destroyed,
    type: 'symbol',
    source: TARGET_SOURCE_IDS.targets,
    filter: ['==', ['get', 'isDestroyed'], true],
    layout: {
      'icon-image': TARGET_DESTROYED_ICON_ID,
      'icon-size': TARGET_DESTROYED_ICON_SIZE,
      'icon-allow-overlap': true,
    },
  });

  /* 5. Status rings */
  ensureLayer(map, {
    id: TARGET_LAYER_IDS.ringRed,
    type: 'circle',
    source: TARGET_SOURCE_IDS.targets,
    filter: [
      'any',
      ['==', ['get', 'isAssigned'], true],
      ['==', ['get', 'isLocked'], true],
    ],
    paint: TARGET_RING_RED_PAINT,
  });

  ensureLayer(map, {
    id: TARGET_LAYER_IDS.ringRecommended,
    type: 'circle',
    source: TARGET_SOURCE_IDS.targets,
    filter: [
      'all',
      ['==', ['get', 'isRecommended'], true],
      ['!=', ['get', 'isAssigned'], true],
      ['!=', ['get', 'isLocked'], true],
    ],
    paint: TARGET_RING_RECOMMENDED_PAINT,
  });

  /* 6. Assignment lines — placed BELOW the target icon symbol so the
   *    icons sit on top of the line endpoint. */
  ensureLayer(
    map,
    {
      id: TARGET_LAYER_IDS.assignmentLocked,
      type: 'line',
      source: TARGET_SOURCE_IDS.assignmentLines,
      filter: ['==', ['get', 'isLocked'], true],
      paint: TARGET_ASSIGNMENT_LOCKED_PAINT,
    },
    TARGET_LAYER_IDS.icons,
  );
  ensureLayer(
    map,
    {
      id: TARGET_LAYER_IDS.assignmentAllocated,
      type: 'line',
      source: TARGET_SOURCE_IDS.assignmentLines,
      filter: ['==', ['get', 'isAllocated'], true],
      paint: TARGET_ASSIGNMENT_ALLOCATED_PAINT,
    },
    TARGET_LAYER_IDS.icons,
  );
  ensureLayer(
    map,
    {
      id: TARGET_LAYER_IDS.assignmentAssigned,
      type: 'line',
      source: TARGET_SOURCE_IDS.assignmentLines,
      filter: [
        'all',
        ['==', ['get', 'isAssigned'], true],
        ['!=', ['get', 'isLocked'], true],
      ],
      paint: TARGET_ASSIGNMENT_ASSIGNED_PAINT,
    },
    TARGET_LAYER_IDS.icons,
  );

  /* 7. Labels LAST */
  ensureLayer(map, {
    id: TARGET_LAYER_IDS.labels,
    type: 'symbol',
    source: TARGET_SOURCE_IDS.targets,
    filter: ['!=', ['get', 'isDestroyed'], true],
    layout: {
      visibility: options.labelsVisible ? 'visible' : 'none',
      ...TARGET_LABEL_LAYOUT,
    },
    paint: TARGET_LABEL_PAINT,
  });
}

/**
 * Sanity check after `installTargetLayers`. MapLibre can return
 * silently from `addLayer` if the style is mid-rebuild and the layer
 * won't actually be queryable. Re-checking via `getSource`/`getLayer`
 * lets the caller's retry loop reinstall cleanly on the next tick.
 */
export function verifyTargetLayersInstalled(map: MaplibreMap): boolean {
  return (
    !!map.getSource(TARGET_SOURCE_IDS.targets) &&
    !!map.getLayer(TARGET_LAYER_IDS.icons) &&
    !!map.getLayer(TARGET_LAYER_IDS.labels)
  );
}
