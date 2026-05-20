import type { Coordinates } from './types';
import { calculateCenter } from './rings';

export function getEntityAnchor(entity: {
  type?: string;
  coordinates?: Coordinates[];
}): { lat: number; lng: number } {
  if (!entity) return { lat: 0, lng: 0 };
  const coords: Coordinates[] = entity.coordinates ?? [];
  if (coords.length === 0) return { lat: 0, lng: 0 };
  if (entity.type === 'circle' || entity.type === 'ellipse') {
    return coords[0];
  }
  return calculateCenter(coords);
}
