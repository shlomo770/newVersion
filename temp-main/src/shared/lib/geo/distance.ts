import { EARTH_RADIUS_M, toRad, toDeg } from './constants';
import type { Coordinates } from './types';
import { metersPerDegree } from './meters';

export function calculateDistance(a: Coordinates, b: Coordinates): number {
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δφ = toRad(b.lat - a.lat);
  const Δλ = toRad(b.lng - a.lng);
  const s =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function bearingRad(a: Coordinates, b: Coordinates): number {
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δλ = toRad(b.lng - a.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return Math.atan2(y, x);
}

/** Bearing in degrees [0, 360). */
export function bearingDegrees(a: Coordinates, b: Coordinates): number {
  return (toDeg(bearingRad(a, b)) + 360) % 360;
}

export function destination(
  start: Coordinates,
  distMeters: number,
  bearingRadians: number,
): Coordinates {
  const δ = distMeters / EARTH_RADIUS_M;
  const θ = bearingRadians;
  const φ1 = toRad(start.lat);
  const λ1 = toRad(start.lng);
  const sinφ1 = Math.sin(φ1);
  const cosφ1 = Math.cos(φ1);
  const sinδ = Math.sin(δ);
  const cosδ = Math.cos(δ);
  const sinθ = Math.sin(θ);
  const cosθ = Math.cos(θ);
  const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * cosθ;
  const φ2 = Math.asin(sinφ2);
  const y = sinθ * sinδ * cosφ1;
  const x = cosδ - sinφ1 * sinφ2;
  const λ2 = λ1 + Math.atan2(y, x);
  const lng = ((toDeg(λ2) + 540) % 360) - 180;
  const lat = toDeg(φ2);
  return { lat, lng };
}

/** @deprecated Prefer `destination` with bearing in radians. */
export function destPoint(
  lng: number,
  lat: number,
  bearingDeg: number,
  distanceM: number,
): [number, number] {
  const point = destination({ lng, lat }, distanceM, toRad(bearingDeg));
  return [point.lng, point.lat];
}

export function formatDistance(meters: number): string {
  const km = (meters / 1000).toFixed(2);
  return `${km} km`;
}

export function formatArea(squareMeters: number): string {
  if (!Number.isFinite(squareMeters)) return '0 m²';
  if (squareMeters < 1_000_000) {
    return `${squareMeters.toFixed(0)} m²`;
  }
  const km2 = squareMeters / 1_000_000;
  return `${km2.toFixed(2)} km²`;
}

export function calculatePolygonArea(points: Coordinates[]): number {
  if (points.length < 3) return 0;
  const avgLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const avgLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
  const { mPerDegLat, mPerDegLng } = metersPerDegree(avgLat);
  const projected = points.map((p) => ({
    x: (p.lng - avgLng) * mPerDegLng,
    y: (p.lat - avgLat) * mPerDegLat,
  }));
  let area = 0;
  for (let i = 0; i < projected.length; i++) {
    const j = (i + 1) % projected.length;
    area += projected[i].x * projected[j].y - projected[j].x * projected[i].y;
  }
  return Math.abs(area) / 2;
}
