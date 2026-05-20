import {
  createCirclePolygon,
  createEllipsePolygon,
  createSectorPolygon,
} from '@shared/lib/geo';
import type { Coordinates } from '../models/coordinates';
import type { EntityType, GeoJsonGeometry, TacticalEntity } from '../models/entity';
import { closePolygonCoordinates } from '../utils/polygon';

function mapCoordinatesToGeoJson(
  type: EntityType,
  coordinates: Coordinates[],
): { type: GeoJsonGeometry['type']; coordinates: GeoJsonGeometry['coordinates'] } {
  let geoJsonCoordinates: number[] | number[][] | number[][][];

  if (type === 'polygon' || type === 'rectangle') {
    geoJsonCoordinates = [coordinates.map((coord) => [coord.lng, coord.lat])];
  } else if (type === 'circle' || type === 'ellipse') {
    if (coordinates.length >= 2) {
      const center = coordinates[0];
      const edge = coordinates[1];
      const polygonPoints =
        type === 'circle'
          ? createCirclePolygon(center, edge, 64)
          : createEllipsePolygon(center, edge, 64);
      geoJsonCoordinates = [polygonPoints.map((coord) => [coord.lng, coord.lat])];
    } else {
      geoJsonCoordinates = coordinates.length ? [coordinates.map((coord) => [coord.lng, coord.lat])] : [[]];
    }
  } else if (type === 'sector') {
    if (coordinates.length >= 3) {
      const sectorPolygonPoints = createSectorPolygon(
        coordinates[0],
        coordinates[1],
        coordinates[2],
        32,
      );
      geoJsonCoordinates = [sectorPolygonPoints.map((coord) => [coord.lng, coord.lat])];
    } else {
      geoJsonCoordinates = [coordinates.map((coord) => [coord.lng, coord.lat])];
    }
  } else if (type === 'line') {
    geoJsonCoordinates = coordinates.map((coord) => [coord.lng, coord.lat]);
  } else {
    geoJsonCoordinates = coordinates[0] ? [coordinates[0].lng, coordinates[0].lat] : [0, 0];
  }

  const geometryType =
    type === 'polygon' ||
    type === 'rectangle' ||
    type === 'circle' ||
    type === 'ellipse' ||
    type === 'sector'
      ? 'Polygon'
      : type === 'line'
        ? 'LineString'
        : 'Point';

  return { type: geometryType, coordinates: geoJsonCoordinates };
}

export function buildGeometryForCreate(type: EntityType, coordinates: Coordinates[]): GeoJsonGeometry {
  const finalCoordinates =
    type === 'polygon' ? closePolygonCoordinates(coordinates) : coordinates;
  return mapCoordinatesToGeoJson(type, finalCoordinates);
}

export function buildGeometryForUpdate(
  entity: TacticalEntity,
  coordinates: Coordinates[],
): GeoJsonGeometry {
  const mapped = mapCoordinatesToGeoJson(entity.type, coordinates);
  return {
    type: entity.geometry.type,
    coordinates: mapped.coordinates,
  };
}
