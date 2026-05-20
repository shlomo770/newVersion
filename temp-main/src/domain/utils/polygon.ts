import type { Coordinates } from '../models/coordinates';

export function closePolygonCoordinates(coords: Coordinates[]): Coordinates[] {
  if (coords.length === 0) {
    return coords;
  }
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first.lng === last.lng && first.lat === last.lat) {
    return coords;
  }
  return [...coords, first];
}

export function openPolygonCoordinates(coords: Coordinates[]): Coordinates[] {
  if (coords.length <= 1) {
    return coords;
  }
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first.lng === last.lng && first.lat === last.lat) {
    return coords.slice(0, -1);
  }
  return coords;
}
