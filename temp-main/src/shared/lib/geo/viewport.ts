import type { Map as MaplibreMap } from 'maplibre-gl';

export interface LngLatPoint {
  lng: number;
  lat: number;
}

export function projectAnchorToScreen(
  map: MaplibreMap,
  anchor: LngLatPoint,
): { x: number; y: number } {
  const p = map.project([anchor.lng, anchor.lat]);
  return { x: p.x, y: p.y };
}
