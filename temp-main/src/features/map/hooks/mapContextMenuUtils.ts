import type { MapMouseEvent, MapTouchEvent } from 'maplibre-gl';
import {
  TARGET_LAYER_IDS as CANONICAL_TARGET_LAYER_IDS,
  entityLayerIdFor,
} from '@features/map/config';
import type { MapTargetMenuEntry } from '../components/MapTargetSelectionMenu';

/** Legacy target layer id that some basemaps may still expose. */
const LEGACY_TARGET_CIRCLE_LAYER_ID = 'targets-circle-layer';

/**
 * Pickable target layer ids the context menu should hit-test against.
 * Wraps the canonical icon layer + the legacy "circle" layer id used by
 * older basemap variants.
 */
export const TARGET_LAYER_IDS = [
  CANONICAL_TARGET_LAYER_IDS.icons,
  LEGACY_TARGET_CIRCLE_LAYER_ID,
] as const;

export interface ContextMenuState {
  entityId: string;
  x: number;
  y: number;
  isTarget: boolean;
}

export interface TargetSelectionState {
  targets: MapTargetMenuEntry[];
  x: number;
  y: number;
}

export function safePreventDefault(e: MapMouseEvent | MapTouchEvent): void {
  const ev = e.originalEvent;
  if (ev && typeof ev.preventDefault === 'function' && ev.cancelable) {
    ev.preventDefault();
  }
}

export function buildEntityLayerIds(entityIds: string[]): string[] {
  return entityIds.map(entityLayerIdFor);
}

export function resolveTargetEntries(
  featureIds: string[],
  byId: Record<string, { id: string; type: string; friend?: boolean } | undefined>,
): MapTargetMenuEntry[] {
  return featureIds
    .map((id) => {
      const target = byId[id];
      if (!target) return null;
      return {
        id: target.id,
        type: target.type,
        friend: Boolean(target.friend),
      };
    })
    .filter((entry): entry is MapTargetMenuEntry => entry !== null);
}
