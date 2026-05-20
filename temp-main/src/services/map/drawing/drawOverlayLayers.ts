import type {
  Map as MaplibreMap,
  GeoJSONSource,
  FillLayerSpecification,
  LineLayerSpecification,
  CircleLayerSpecification,
} from 'maplibre-gl';
import type { GeoJSON as GeoJsonData } from 'geojson';

export type OverlayLayerType = 'fill' | 'line' | 'circle';

/** One GeoJSON source and every layer that references it. */
export interface SourceLayerBundle {
  sourceId: string;
  layerIds: string[];
}

export function ensureGeoJsonSource(
  map: MaplibreMap,
  sourceId: string,
  data: GeoJsonData,
): void {
  const source = map.getSource(sourceId) as GeoJSONSource | undefined;
  if (source) {
    source.setData(data);
    return;
  }
  map.addSource(sourceId, { type: 'geojson', data });
}

export function ensurePaintLayer(
  map: MaplibreMap,
  layerId: string,
  layerType: 'fill',
  sourceId: string,
  paint: FillLayerSpecification['paint'],
): void;
export function ensurePaintLayer(
  map: MaplibreMap,
  layerId: string,
  layerType: 'line',
  sourceId: string,
  paint: LineLayerSpecification['paint'],
): void;
export function ensurePaintLayer(
  map: MaplibreMap,
  layerId: string,
  layerType: 'circle',
  sourceId: string,
  paint: CircleLayerSpecification['paint'],
): void;
export function ensurePaintLayer(
  map: MaplibreMap,
  layerId: string,
  layerType: OverlayLayerType,
  sourceId: string,
  paint:
    | FillLayerSpecification['paint']
    | LineLayerSpecification['paint']
    | CircleLayerSpecification['paint'],
): void {
  if (map.getLayer(layerId)) return;
  switch (layerType) {
    case 'fill':
      map.addLayer({ id: layerId, type: 'fill', source: sourceId, paint: paint as FillLayerSpecification['paint'] });
      break;
    case 'line':
      map.addLayer({ id: layerId, type: 'line', source: sourceId, paint: paint as LineLayerSpecification['paint'] });
      break;
    case 'circle':
      map.addLayer({ id: layerId, type: 'circle', source: sourceId, paint: paint as CircleLayerSpecification['paint'] });
      break;
  }
}

export function removeLayerIfPresent(map: MaplibreMap, layerId: string): void {
  if (!map.getLayer(layerId)) return;
  try {
    map.removeLayer(layerId);
  } catch (error) {
    console.warn('[drawOverlayLayers] removeLayer failed:', layerId, error);
  }
}

export function removeLayersIfPresent(map: MaplibreMap, layerIds: readonly string[]): void {
  for (const layerId of layerIds) {
    removeLayerIfPresent(map, layerId);
  }
}

export function removeSourceIfPresent(map: MaplibreMap, sourceId: string): void {
  if (!map.getSource(sourceId)) return;
  try {
    map.removeSource(sourceId);
  } catch (error) {
    console.warn('[drawOverlayLayers] removeSource failed:', sourceId, error);
  }
}

export function removeLayerAndSource(map: MaplibreMap, layerId: string, sourceId?: string): void {
  removeLayerIfPresent(map, layerId);
  if (sourceId) {
    removeSourceIfPresent(map, sourceId);
  }
}

export function removeSourceBundle(map: MaplibreMap, bundle: SourceLayerBundle): void {
  removeLayersIfPresent(map, bundle.layerIds);
  removeSourceIfPresent(map, bundle.sourceId);
}

export function removeSourceBundles(map: MaplibreMap, bundles: readonly SourceLayerBundle[]): void {
  for (const bundle of bundles) {
    removeLayersIfPresent(map, bundle.layerIds);
    removeSourceIfPresent(map, bundle.sourceId);
  }
}

/**
 * Removes multiple source bundles. Layers are always removed before any source.
 */
export function removeSourceBundlesSafe(map: MaplibreMap, bundles: readonly SourceLayerBundle[]): void {
  for (const bundle of bundles) {
    removeLayersIfPresent(map, bundle.layerIds);
  }
  for (const bundle of bundles) {
    removeSourceIfPresent(map, bundle.sourceId);
  }
}

export function safePreventMapEvent(event: { preventDefault?: () => void; originalEvent?: Event }): void {
  event.preventDefault?.();
  event.originalEvent?.preventDefault();
}
