import { EntityCategoryEnum, EntityTypeEnum } from '../enums/entity.enum';
import type { Coordinates } from '../models/coordinates';
import type { EntityType } from '../models/entity';
import { calculateDistance, metersPerDegree } from '@/utils/geometry';
import { closePolygonCoordinates } from '../utils/polygon';
import { isPlainObject, readFiniteNumber } from '../utils/record';

export type SaveEntityWireType = 'LINE' | 'ELLIPSE' | 'SECTOR' | 'POLYGON';

export interface SaveEntityShapeParams {
  lat?: number;
  lng?: number;
  radius_1?: number;
  radius_2?: number;
}

export interface SaveEntityPayload {
  name: string;
  temp_id: string;
  category: EntityCategoryEnum;
  type: SaveEntityWireType;
  coordinates: Coordinates[];
  alt?: number;
  params?: SaveEntityShapeParams;
}

export interface UpdateEntityPayload {
  id: string;
  category: EntityCategoryEnum;
  type: SaveEntityWireType;
  coordinates: Coordinates[];
  alt?: number;
  params?: SaveEntityShapeParams;
}

export function toServerEntityCategory(category: EntityCategoryEnum): EntityCategoryEnum {
  if (category === EntityCategoryEnum.WCO_FREE) {
    return EntityCategoryEnum.WCO_FREE;
  }
  if (category === EntityCategoryEnum.WCO_HOLD) {
    return EntityCategoryEnum.WCO_HOLD;
  }
  if (category === EntityCategoryEnum.FIZ) {
    return EntityCategoryEnum.FIZ;
  }
  return EntityCategoryEnum.FREE;
}

export function toLocalEntityCategory(category: unknown): EntityCategoryEnum {
  const numeric = readFiniteNumber(category);
  if (
    numeric === EntityCategoryEnum.FREE ||
    numeric === EntityCategoryEnum.FIZ ||
    numeric === EntityCategoryEnum.WCO_FREE ||
    numeric === EntityCategoryEnum.WCO_HOLD
  ) {
    return numeric;
  }
  return EntityCategoryEnum.FREE;
}

export function toServerEntityType(type: EntityType): SaveEntityWireType | null {
  if (type === 'line') {
    return 'LINE';
  }
  if (type === 'ellipse') {
    return 'ELLIPSE';
  }
  if (type === 'sector') {
    return 'SECTOR';
  }
  if (type === 'polygon') {
    return 'POLYGON';
  }
  if (type === 'circle') {
    return 'ELLIPSE';
  }
  return null;
}

export function toLocalEntityType(type: string): EntityType | null {
  const normalized = String(type || '').trim().toUpperCase();
  if (normalized === 'LINE') {
    return 'line';
  }
  if (normalized === 'ELLIPSE') {
    return 'ellipse';
  }
  if (normalized === 'SECTOR') {
    return 'sector';
  }
  if (normalized === 'POLYGON') {
    return 'polygon';
  }
  if (normalized === 'RECTANGLE') {
    return 'rectangle';
  }
  if (normalized === 'CIRCLE') {
    return 'circle';
  }
  if (normalized === 'MARKER' || normalized === 'POINT') {
    return 'marker';
  }
  const lower = String(type || '').trim().toLowerCase();
  switch (lower) {
    case 'polygon':
    case 'line':
    case 'rectangle':
    case 'circle':
    case 'ellipse':
    case 'sector':
    case 'marker':
    case 'target':
    case 'measure':
    case 'measure-area':
      return lower;
    default:
      return null;
  }
}

function parseCoordinatePair(value: unknown): Coordinates | null {
  if (Array.isArray(value) && value.length >= 2) {
    const lng = readFiniteNumber(value[0]);
    const lat = readFiniteNumber(value[1]);
    const altRaw = readFiniteNumber(value[2]);
    if (lat === undefined || lng === undefined) {
      return null;
    }
    return {
      lat,
      lng,
      alt: altRaw,
    };
  }

  if (!isPlainObject(value)) {
    return null;
  }

  const lat = readFiniteNumber(value.lat);
  const lng = readFiniteNumber(value.lng);
  const altRaw = readFiniteNumber(value.alt);
  if (lat === undefined || lng === undefined) {
    return null;
  }

  return {
    lat,
    lng,
    alt: altRaw,
  };
}

export function normalizeCoordinates(coordinates: unknown): Coordinates[] {
  if (!Array.isArray(coordinates)) {
    return [];
  }

  const output: Coordinates[] = [];
  for (const entry of coordinates) {
    const parsed = parseCoordinatePair(entry);
    if (parsed) {
      output.push(parsed);
    }
  }
  return output;
}

export function buildSaveEntityPayload(
  id: string,
  localCategory: EntityCategoryEnum,
  localType: EntityType,
  coordinates: Coordinates[],
  name: string
): SaveEntityPayload | null {
  const serverType = toServerEntityType(localType);
  if (!serverType || coordinates.length === 0) {
    return null;
  }

  const center = coordinates[0];
  const firstValidAlt = coordinates
    .map((coordinate) => readFiniteNumber(coordinate.alt))
    .find((value): value is number => value !== undefined);
  const centerAlt = readFiniteNumber(center.alt) ?? firstValidAlt;
  const fallbackAlt = centerAlt ?? 0;

  const normalizedCoordinates: Coordinates[] = coordinates.map((coordinate) => ({
    lat: coordinate.lat,
    lng: coordinate.lng,
    alt: readFiniteNumber(coordinate.alt) ?? fallbackAlt,
  }));

  const payload: SaveEntityPayload = {
    temp_id: id,
    category: toServerEntityCategory(localCategory),
    type: serverType,
    coordinates:
      localType === 'polygon'
        ? closePolygonCoordinates(normalizedCoordinates)
        : normalizedCoordinates,
    alt: fallbackAlt,
    params: {},
    name,
  };

  if (localType === 'circle' && coordinates.length >= 2) {
    const edge = coordinates[1];
    const radius = calculateDistance(center, edge);
    payload.coordinates = [center];
    payload.params = {
      lat: center.lat,
      lng: center.lng,
      radius_1: radius,
      radius_2: radius,
    };
    return payload;
  }

  if (localType === 'ellipse' && coordinates.length >= 2) {
    const edge = coordinates[1];
    const { mPerDegLat, mPerDegLng } = metersPerDegree(center.lat);
    const radius1 = Math.abs(edge.lng - center.lng) * mPerDegLng;
    const radius2 = Math.abs(edge.lat - center.lat) * mPerDegLat;
    payload.coordinates = [center];
    payload.params = {
      lat: center.lat,
      lng: center.lng,
      radius_1: Number.isFinite(radius1) ? radius1 : 0,
      radius_2: Number.isFinite(radius2) ? radius2 : 0,
    };
    return payload;
  }

  return payload;
}

export function buildUpdateEntityPayload(
  id: string,
  localCategory: EntityCategoryEnum,
  localType: EntityType,
  coordinates: Coordinates[],
  name: string
): UpdateEntityPayload | null {
  const savePayload = buildSaveEntityPayload(id, localCategory, localType, coordinates, name);
  if (!savePayload) {
    return null;
  }

  const { temp_id, ...rest } = savePayload;
  return {
    id: temp_id,
    ...rest,
  };
}

export function toEntityCategoryEnum(value: string | null | undefined): EntityTypeEnum {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');

  switch (normalized) {
    case 'ELLIPSE':
      return EntityTypeEnum.ELLIPSE;
    case 'POLYGON':
      return EntityTypeEnum.POLYGON;
    case 'LINE':
      return EntityTypeEnum.POLYLINE;
    default:
      return EntityTypeEnum.POLYGON;
  }
}

export function buildCircleCoordinatesFromPointRadius(
  point: { lat: number; lng: number; alt?: number },
  radiusMeters: number
): Coordinates[] {
  const { mPerDegLng } = metersPerDegree(point.lat);
  const edgeLng = point.lng + radiusMeters / mPerDegLng;
  return [
    { lat: point.lat, lng: point.lng, alt: point.alt },
    { lat: point.lat, lng: edgeLng, alt: point.alt },
  ];
}

export function buildEllipseCoordinatesFromCenterRadii(
  point: { lat: number; lng: number; alt?: number },
  radius1Meters: number,
  radius2Meters: number
): Coordinates[] {
  const { mPerDegLat, mPerDegLng } = metersPerDegree(point.lat);
  const edgeLng = point.lng + radius1Meters / mPerDegLng;
  const edgeLat = point.lat + radius2Meters / mPerDegLat;
  return [
    { lat: point.lat, lng: point.lng, alt: point.alt },
    { lat: edgeLat, lng: edgeLng, alt: point.alt },
  ];
}
