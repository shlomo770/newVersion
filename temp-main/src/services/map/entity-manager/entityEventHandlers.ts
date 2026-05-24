import type { Map as MaplibreMap } from 'maplibre-gl';
import { calculateCenter } from '@shared/lib/geo';
import { formatEntityCategoryLabel } from '@/constants/entityCategories';
import { MAP_LABEL_DEFAULTS } from '@/services/map/config';
import {
  entityLabelLayerId,
  entityLabelSourceId,
} from './entityIds';
import type { CoordLike, MapLayerEntity } from './entityManagerTypes';
import { LABEL_ENTITY_TYPES } from './entityLayerStyle';

function normalizeCoord(c: CoordLike): { lng: number; lat: number } | null {
  if (Array.isArray(c)) {
    return Number.isFinite(c[0]) && Number.isFinite(c[1]) ? { lng: c[0], lat: c[1] } : null;
  }
  if (typeof c.lng === 'number' && typeof c.lat === 'number') {
    return { lng: c.lng, lat: c.lat };
  }
  return null;
}

/** Center of polygon/circle/ellipse/rectangle/sector/line for label placement. */
export function getEntityCenter(entity: MapLayerEntity): [number, number] | null {
  const fillTypes = ['polygon', 'rectangle', 'circle', 'ellipse', 'sector'];
  const lineType = entity.type === 'line';
  if (!fillTypes.includes(entity.type) && !lineType) return null;

  if (entity.type === 'circle' || entity.type === 'ellipse' || entity.type === 'sector') {
    if (entity.coordinates[0]) {
      const c = normalizeCoord(entity.coordinates[0] as CoordLike);
      return c ? [c.lng, c.lat] : null;
    }
    return null;
  }

  if (entity.type === 'line') {
    const coords = entity.coordinates.length
      ? entity.coordinates
          .map((c) => normalizeCoord(c as CoordLike))
          .filter((c): c is { lng: number; lat: number } => c !== null)
      : entity.geometry &&
          typeof entity.geometry === 'object' &&
          'type' in entity.geometry &&
          entity.geometry.type === 'LineString' &&
          Array.isArray(entity.geometry.coordinates)
        ? entity.geometry.coordinates
            .filter((pair): pair is [number, number] => Array.isArray(pair) && pair.length >= 2)
            .map((pair) => ({ lng: pair[0], lat: pair[1] }))
        : [];
    if (coords.length === 0) return null;
    const center = calculateCenter(coords);
    return [center.lng, center.lat];
  }

  if (
    entity.geometry &&
    typeof entity.geometry === 'object' &&
    'type' in entity.geometry &&
    entity.geometry.type === 'Polygon' &&
    Array.isArray(entity.geometry.coordinates[0])
  ) {
    const ring = entity.geometry.coordinates[0] as number[][];
    const coords = ring.map((c) => ({ lng: c[0], lat: c[1] }));
    const center = calculateCenter(coords);
    return [center.lng, center.lat];
  }

  if (entity.coordinates.length) {
    const center = calculateCenter(entity.coordinates);
    return [center.lng, center.lat];
  }
  return null;
}

export function getEntityLabelForMap(entity: MapLayerEntity): string {
  const rawCat = entity.category ?? entity.properties?.category;
  const categoryDisplay = formatEntityCategoryLabel(rawCat);
  const name = entity.name ?? '';
  const type = entity.type ?? 'entity';
  const typeLabel = String(type).toUpperCase().replace(/_/g, ' ');
  const nameStr = String(name).trim();

  if (!categoryDisplay || categoryDisplay.toUpperCase() === 'FREE') {
    return nameStr || typeLabel;
  }
  if (nameStr) {
    return `${nameStr} (${categoryDisplay})`;
  }
  return categoryDisplay || typeLabel;
}

export function buildEntityLabelFeature(
  entity: MapLayerEntity,
): GeoJSON.Feature<GeoJSON.Point, { label: string }> | null {
  const center = getEntityCenter(entity);
  if (!center) return null;
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: center },
    properties: { label: getEntityLabelForMap(entity) },
  };
}

/** Map label layer (name + category) centered on fill/line entities. */
export function addEntityLabelLayer(map: MaplibreMap, entity: MapLayerEntity): void {
  if (!LABEL_ENTITY_TYPES.includes(entity.type as (typeof LABEL_ENTITY_TYPES)[number])) {
    return;
  }

  const pointFeature = buildEntityLabelFeature(entity);
  if (!pointFeature) return;

  const labelSourceId = entityLabelSourceId(entity.id);
  const labelLayerId = entityLabelLayerId(entity.id);

  try {
    if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId);
    if (map.getSource(labelSourceId)) map.removeSource(labelSourceId);

    map.addSource(labelSourceId, { type: 'geojson', data: pointFeature });
    map.addLayer({
      id: labelLayerId,
      type: 'symbol',
      source: labelSourceId,
      layout: {
        'text-field': ['get', 'label'],
        'text-font': [...MAP_LABEL_DEFAULTS.font],
        'text-size': MAP_LABEL_DEFAULTS.textSize,
        'text-anchor': 'center',
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': MAP_LABEL_DEFAULTS.textColor,
        'text-halo-color': MAP_LABEL_DEFAULTS.haloColor,
        'text-halo-width': MAP_LABEL_DEFAULTS.haloWidth,
      },
    });
  } catch (e) {
    console.warn('[EntityLabel] שגיאה ביצירת תווית:', entity.id, e);
  }
}

export function syncEntityLabelLayer(map: MaplibreMap, entity: MapLayerEntity): void {
  const labelSourceId = entityLabelSourceId(entity.id);
  const labelSource = map.getSource(labelSourceId) as maplibregl.GeoJSONSource | undefined;
  const pointFeature = buildEntityLabelFeature(entity);
  if (!pointFeature) return;

  if (labelSource) {
    labelSource.setData(pointFeature);
    return;
  }
  addEntityLabelLayer(map, entity);
}
