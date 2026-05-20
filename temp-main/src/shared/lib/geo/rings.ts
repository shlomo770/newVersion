import type { Coordinates } from './types';

export function toLngLatPairs(coords: Coordinates[]): [number, number][] {
  return coords.map((c) => [c.lng, c.lat]);
}

export function closeRing(coords: Coordinates[]): Coordinates[] {
  if (coords.length === 0) return coords;
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first.lat !== last.lat || first.lng !== last.lng) {
    return [...coords, { ...first }];
  }
  return coords;
}

export function calculateCenter(coordinates: Coordinates[]): Coordinates {
  if (coordinates.length === 0) {
    return { lat: 0, lng: 0 };
  }
  const sumLat = coordinates.reduce((sum, p) => sum + p.lat, 0);
  const sumLng = coordinates.reduce((sum, p) => sum + p.lng, 0);
  return {
    lat: sumLat / coordinates.length,
    lng: sumLng / coordinates.length,
  };
}

export function calculateBoundingBox(coordinates: Coordinates[]): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  if (coordinates.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }
  const lats = coordinates.map((p) => p.lat);
  const lngs = coordinates.map((p) => p.lng);
  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs),
  };
}
