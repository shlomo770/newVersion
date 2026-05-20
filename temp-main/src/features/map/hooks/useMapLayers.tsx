import type { ReactElement } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import MapTacticalLayers, { type MapTacticalLayersProps } from '../layers/MapTacticalLayers';

export type UseMapLayersParams = MapTacticalLayersProps;

/**
 * Layer composer hook — returns the tactical layer tree for the active map instance.
 */
export function useMapLayers(
  map: MaplibreMap | null,
  params: Omit<UseMapLayersParams, 'map'>,
): ReactElement | null {
  if (!map) {
    return null;
  }
  return <MapTacticalLayers map={map} onAbortTarget={params.onAbortTarget} />;
}

export { MapTacticalLayers };
