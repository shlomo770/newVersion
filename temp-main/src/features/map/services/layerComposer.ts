import type { ReactElement } from 'react';
import { createElement } from 'react';
import MapTacticalLayers from '../layers/MapTacticalLayers';

export interface TacticalLayerComposerOptions {
  map: maplibregl.Map;
  onAbortTarget: (targetId: string) => void;
}

/**
 * Imperative entry for non-React callers; React map shell uses `useMapLayers` / `MapTacticalLayers` directly.
 */
export function composeTacticalLayers(options: TacticalLayerComposerOptions): ReactElement {
  return createElement(MapTacticalLayers, {
    map: options.map,
    onAbortTarget: options.onAbortTarget,
  });
}
