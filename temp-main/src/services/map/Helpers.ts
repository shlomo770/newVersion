import type { Feature } from 'geojson';
import { Coordinates, EntityType } from '@/types';

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

function positionToCoordinates(position: [number, number]): Coordinates {
  return { lng: position[0], lat: position[1] };
}

export function convertFeatureToCoordinates(feature: Feature): Coordinates[] {
  if (!feature.geometry) return [];
  const geometry = feature.geometry;

  if (geometry.type === 'Point') {
    const pointCoords = geometry.coordinates;
    return isPositionPair(pointCoords) ? [positionToCoordinates(pointCoords)] : [];
  }

  if (geometry.type === 'LineString') {
    const lineCoords = geometry.coordinates;
    if (!Array.isArray(lineCoords)) return [];
    return lineCoords.filter(isPositionPair).map(positionToCoordinates);
  }

  if (geometry.type === 'Polygon') {
    const polygonCoords = geometry.coordinates;
    if (!Array.isArray(polygonCoords) || !Array.isArray(polygonCoords[0])) return [];
    return polygonCoords[0].filter(isPositionPair).map(positionToCoordinates);
  }

  return [];
}

export function getEntityTypeFromFeature(
  feature: Feature,
  currentDrawingMode: EntityType | null,
): EntityType {
  if (currentDrawingMode) {
    return currentDrawingMode;
  }
  switch (feature.geometry?.type) {
    case 'Point':
      return 'marker';
    case 'LineString':
      return 'line';
    case 'Polygon':
      return 'polygon';
    default:
      return 'polygon';
  }
}

export function simpleDistance(a: { lng: number; lat: number }, b: { lng: number; lat: number }) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const x = dLng * Math.cos((lat1 + lat2) / 2);
  const y = dLat;
  return Math.sqrt(x * x + y * y) * R;
}

export function simpleBearing(a: { lng: number; lat: number }, b: { lng: number; lat: number }) {
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

export function distanceToSegment(point: Coordinates, p1: Coordinates, p2: Coordinates): number {
  const x = point.lng;
  const y = point.lat;
  const x1 = p1.lng;
  const y1 = p1.lat;
  const x2 = p2.lng;
  const y2 = p2.lat;
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) {
    param = dot / lenSq;
  }
  let xx, yy;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  const dx = x - xx;
  const dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}
