import { toRad } from './constants';

export function metersPerDegree(latDeg: number): { mPerDegLat: number; mPerDegLng: number } {
  const φ = toRad(latDeg);
  const mPerDegLat = 111132.92 - 559.82 * Math.cos(2 * φ) + 1.175 * Math.cos(4 * φ);
  const mPerDegLng = 111412.84 * Math.cos(φ) - 93.5 * Math.cos(3 * φ);
  return { mPerDegLat, mPerDegLng };
}
