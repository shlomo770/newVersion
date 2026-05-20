import type { Map as MaplibreMap } from 'maplibre-gl';
import { calculateCenter } from '@shared/lib/geo';
import { formatEntityCategoryLabel } from '@/constants/entityCategories';
import {
  entityLabelLayerId,
  entityLabelSourceId,
} from './entityIds';
import type { CoordLike, EntityGeoJsonFeature, MapLayerEntity } from './entityManagerTypes';
import { LABEL_ENTITY_TYPES } from './entityLayerStyle';

export function logPolygonDiagnostics(
  entity: MapLayerEntity,
  geojson: EntityGeoJsonFeature,
  phase: string,
): void {
  if (entity.type !== 'polygon') return;
  try {
    const ring =
      geojson.geometry.type === 'Polygon' ? geojson.geometry.coordinates[0] : null;
    if (!Array.isArray(ring) || ring.length === 0) {
      console.warn(`[PolygonDebug:${phase}] no ring`, {
        id: entity.id,
        geometry: geojson.geometry,
      });
      return;
    }
    const first = ring[0];
    const last = ring[ring.length - 1];
    const isClosed =
      Array.isArray(first) &&
      Array.isArray(last) &&
      first[0] === last[0] &&
      first[1] === last[1];
    const invalidPoints = ring.filter(
      (p) =>
        !Array.isArray(p) ||
        p.length < 2 ||
        !Number.isFinite(Number(p[0])) ||
        !Number.isFinite(Number(p[1])),
    ).length;
    console.log(`[PolygonDebug:${phase}]`, {
      id: entity.id,
      ringPoints: ring.length,
      closed: isClosed,
      invalidPoints,
      first,
      last,
    });
  } catch (e) {
    console.warn(`[PolygonDebug:${phase}] diagnostics failed`, e);
  }
}

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
    console.log('[EntityLabel] לא תווית – סוג לא נתמך:', entity.id, entity.type);
    return;
  }

  const pointFeature = buildEntityLabelFeature(entity);
  if (!pointFeature) {
    console.log(
      '[EntityLabel] לא תווית – אין מרכז:',
      entity.id,
      'geometry:',
      Boolean(entity.geometry),
      'coordinates:',
      entity.coordinates.length,
    );
    return;
  }

  const label = pointFeature.properties.label;
  const center = pointFeature.geometry.coordinates;
  console.log(
    '[EntityLabel] מוסיף תווית:',
    entity.id,
    'סוג:',
    entity.type,
    'טקסט על מפה:',
    label,
    'מרכז:',
    center,
  );

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
        'text-font': ['Open Sans Semibold'],
        'text-size': 12,
        'text-anchor': 'center',
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#1a1a1a',
        'text-halo-color': '#ffffff',
        'text-halo-width': 3,
      },
    });
    console.log('[EntityLabel] שכבת תווית נוצרה:', labelLayerId);
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
