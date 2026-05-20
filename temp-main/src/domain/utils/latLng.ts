import type { LatLng } from '../models/coordinates';
import { readFiniteNumber } from './record';

export function isValidLatLng(candidate: unknown): candidate is LatLng {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }
  const record = candidate as Record<string, unknown>;
  const lat = readFiniteNumber(record.lat);
  const lng = readFiniteNumber(record.lng);
  return lat !== undefined && lng !== undefined;
}
