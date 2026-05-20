import type { MapMouseEvent, MapTouchEvent } from 'maplibre-gl';
import type { MapTargetMenuEntry } from '../components/MapTargetSelectionMenu';

export const TARGET_LAYER_IDS = ['targets-layer', 'targets-circle-layer'] as const;

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
  return entityIds.map((id) => `entity-layer-${id}`);
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
