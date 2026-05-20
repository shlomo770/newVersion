import type { GeoJsonGeometry, TacticalEntity } from '@domain/models/entity';
import type { Coordinates } from '@domain/models/coordinates';

export interface EditableMapEntity {
  id: string;
  type: string;
  coordinates: Coordinates[];
  properties?: Record<string, unknown>;
}

function asCoord(pair: [number, number]): Coordinates {
  return { lng: pair[0], lat: pair[1] };
}

function isPointGeometry(
  geometry: GeoJsonGeometry,
): geometry is GeoJsonGeometry & { type: 'Point'; coordinates: [number, number] } {
  return (
    geometry.type === 'Point' &&
    Array.isArray(geometry.coordinates) &&
    geometry.coordinates.length >= 2 &&
    typeof geometry.coordinates[0] === 'number' &&
    typeof geometry.coordinates[1] === 'number'
  );
}

function isLineStringGeometry(
  geometry: GeoJsonGeometry,
): geometry is GeoJsonGeometry & { type: 'LineString'; coordinates: [number, number][] } {
  if (geometry.type !== 'LineString' || !Array.isArray(geometry.coordinates)) return false;
  return geometry.coordinates.every(
    (pair) =>
      Array.isArray(pair) &&
      pair.length >= 2 &&
      typeof pair[0] === 'number' &&
      typeof pair[1] === 'number',
  );
}

function ringFromPolygonGeometry(geometry: TacticalEntity['geometry']): Coordinates[] | null {
  if (!geometry || typeof geometry !== 'object') return null;
  if (geometry.type !== 'Polygon' || !Array.isArray(geometry.coordinates)) return null;
  const ring = geometry.coordinates[0];
  if (!Array.isArray(ring)) return null;
  return ring
    .filter(
      (pair): pair is [number, number] =>
        Array.isArray(pair) &&
        pair.length >= 2 &&
        typeof pair[0] === 'number' &&
        typeof pair[1] === 'number',
    )
    .map(asCoord);
}

export function convertStoreEntityToEditable(
  storeEntity: TacticalEntity | null | undefined,
): EditableMapEntity | null {
  if (!storeEntity) return null;
  const type = (storeEntity.type || '').toLowerCase();
  const geometry = storeEntity.geometry;

  if (geometry && isPointGeometry(geometry)) {
    return {
      id: storeEntity.id,
      type: 'marker',
      coordinates: [asCoord(geometry.coordinates)],
      properties: { ...storeEntity.properties },
    };
  }

  if (geometry && isLineStringGeometry(geometry)) {
    return {
      id: storeEntity.id,
      type: 'line',
      coordinates: geometry.coordinates.map(asCoord),
      properties: { ...storeEntity.properties },
    };
  }

  const polygonRing = ringFromPolygonGeometry(geometry);
  if (polygonRing) {
    return {
      id: storeEntity.id,
      type: type === 'rectangle' ? 'rectangle' : 'polygon',
      coordinates: polygonRing,
      properties: { ...storeEntity.properties },
    };
  }

  if (type === 'circle' || type === 'ellipse') {
    if (Array.isArray(storeEntity.coordinates) && storeEntity.coordinates.length >= 2) {
      return {
        id: storeEntity.id,
        type,
        coordinates: storeEntity.coordinates,
        properties: { ...storeEntity.properties },
      };
    }
  }

  return null;
}
