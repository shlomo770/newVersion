import type { Entity } from '@features/entities';
import type { Map as MaplibreMap } from 'maplibre-gl';

function isPositionPair(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number' &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

function flattenCoordinates(coordinates: number[] | number[][] | number[][][]): number[][] {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return [];
  if (isPositionPair(coordinates)) return [coordinates];
  if (Array.isArray(coordinates[0]) && isPositionPair(coordinates[0])) {
    return coordinates as number[][];
  }
  if (Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0])) {
    return coordinates[0] as number[][];
  }
  return [];
}

export const handleCenterToEntity = (entity: Entity, map: MaplibreMap) => {
  if (!map || !entity.geometry) return;
  try {
    let bounds: [number, number, number, number] | null = null;
    if (entity.geometry.type === 'Point') {
      const pair = entity.geometry.coordinates;
      if (!isPositionPair(pair)) {
        console.error('Invalid coordinates for entity:', entity.id);
        return;
      }
      const [lng, lat] = pair;
      bounds = [lng - 0.01, lat - 0.01, lng + 0.01, lat + 0.01];
    } else if (entity.geometry.type === 'Polygon' || entity.geometry.type === 'LineString') {
      const flatCoords = flattenCoordinates(entity.geometry.coordinates);
      if (flatCoords.length > 0) {
        let minLng = Infinity, maxLng = -Infinity;
        let minLat = Infinity, maxLat = -Infinity;
        let validCoords = true;
        flatCoords.forEach((coord) => {
          if (!isPositionPair(coord)) {
            validCoords = false;
            return;
          }
          const [lng, lat] = coord;
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        });

        if (!validCoords) {
          console.error('Invalid coordinates for entity:', entity.id);
          return;
        }
        bounds = [minLng, minLat, maxLng, maxLat];
      }
    }

    if (bounds && !bounds.some(coord => isNaN(coord))) {
      map.fitBounds(bounds, {
        padding: 50,
        duration: 1000
      });
    } else {
      console.error('Invalid bounds calculated for entity:', entity.id);
    }
  } catch (error) {
    console.error('Error centering to entity:', error);
  }
};
