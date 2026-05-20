/**
 * @deprecated Import from `@shared/lib/geo` instead.
 * Re-export barrel preserves legacy `@/utils/geometry` import paths.
 */
export {
  EARTH_RADIUS_M as R,
  toRad,
  toDeg,
  calculateDistance,
  bearingRad,
  bearingDegrees as bearing,
  destination,
  destPoint,
  formatDistance,
  formatArea,
  calculatePolygonArea,
  metersPerDegree,
  toLngLatPairs,
  closeRing,
  calculateCenter,
  calculateBoundingBox,
  createCirclePolygon,
  createEllipsePolygon,
  createSectorPolygon,
  createRectangleCoordinates,
  getEntityAnchor,
  convertEntitiesToGeoJSON,
  createRectangleMode,
  createCircleMode,
} from '@shared/lib/geo';

export type { Coordinates, Point, LatLng, LatLngManual } from '@shared/lib/geo';
