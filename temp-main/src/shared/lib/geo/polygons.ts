import { EARTH_RADIUS_M, toRad } from './constants';
import type { Coordinates } from './types';
import { calculateDistance, bearingRad, destination } from './distance';
import { metersPerDegree } from './meters';
import { closeRing } from './rings';

export function createCirclePolygon(
  center: Coordinates,
  edge: Coordinates,
  numPoints: number,
): Coordinates[] {
  const dLat = toRad(edge.lat - center.lat);
  const dLng = toRad(edge.lng - center.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(center.lat)) * Math.cos(toRad(edge.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const radius = EARTH_RADIUS_M * c;
  const coords: Coordinates[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;
    const dx = radius * Math.cos(angle);
    const dy = radius * Math.sin(angle);
    const lat = center.lat + (dy / EARTH_RADIUS_M) * (180 / Math.PI);
    const lng =
      center.lng +
      (dx / (EARTH_RADIUS_M * Math.cos((Math.PI * center.lat) / 180))) * (180 / Math.PI);
    coords.push({ lng, lat });
  }
  return coords;
}

export function createEllipsePolygon(
  center: Coordinates,
  edge: Coordinates,
  numPoints: number,
): Coordinates[] {
  const dLat = toRad(edge.lat - center.lat);
  const dLng = toRad(edge.lng - center.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(center.lat)) * Math.cos(toRad(edge.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const majorRadius = EARTH_RADIUS_M * c;
  const minorRadius = majorRadius * 0.6;
  const angle = Math.atan2(dLat, dLng);
  const coords: Coordinates[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = (2 * Math.PI * i) / numPoints;
    const x = majorRadius * Math.cos(t);
    const y = minorRadius * Math.sin(t);
    const rotatedX = x * Math.cos(angle) - y * Math.sin(angle);
    const rotatedY = x * Math.sin(angle) + y * Math.cos(angle);
    const lat = center.lat + (rotatedY / EARTH_RADIUS_M) * (180 / Math.PI);
    const lng =
      center.lng +
      (rotatedX / (EARTH_RADIUS_M * Math.cos((Math.PI * center.lat) / 180))) * (180 / Math.PI);
    coords.push({ lng, lat });
  }
  if (coords.length > 0) {
    coords.push(coords[0]);
  }
  return coords;
}

export function createSectorPolygon(
  center: Coordinates,
  startPoint: Coordinates,
  endPoint: Coordinates,
  numPoints: number = 32,
): Coordinates[] {
  const radius = calculateDistance(center, startPoint);
  const startAngle = bearingRad(center, startPoint);
  const endAngle = bearingRad(center, endPoint);
  let angleDiff = endAngle - startAngle;
  if (angleDiff > Math.PI) {
    angleDiff -= 2 * Math.PI;
  } else if (angleDiff < -Math.PI) {
    angleDiff += 2 * Math.PI;
  }
  const coords: Coordinates[] = [];
  coords.push({ ...center });
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const angle = startAngle + angleDiff * t;
    coords.push(destination(center, radius, angle));
  }
  coords.push({ ...center });
  return coords;
}

export function createRectangleCoordinates(center: Coordinates, handle: Coordinates): Coordinates[] {
  const { mPerDegLat, mPerDegLng } = metersPerDegree(center.lat);
  const dx = (handle.lng - center.lng) * mPerDegLng;
  const dy = (handle.lat - center.lat) * mPerDegLat;
  const hw = Math.abs(dx);
  const hh = Math.abs(dy);
  const cornersEN: Array<{ x: number; y: number }> = [
    { x: -hw, y: +hh },
    { x: +hw, y: +hh },
    { x: +hw, y: -hh },
    { x: -hw, y: -hh },
  ];
  const corners = cornersEN.map(({ x, y }) => {
    const brg = Math.atan2(x, y);
    const dist = Math.hypot(x, y);
    return destination(center, dist, brg);
  });
  return closeRing(corners);
}
