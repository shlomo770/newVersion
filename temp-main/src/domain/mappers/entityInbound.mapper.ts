import { EntityCategoryEnum } from '../enums/entity.enum';
import type { StoredEntityType } from '../models/entity';
import { buildTacticalEntity } from '../models/entity';
import type { TacticalEntity } from '../models/entity';
import { buildGeometryForCreate } from './entityGeometry.mapper';
import {
  normalizeCoordinates,
  toLocalEntityCategory,
  toLocalEntityType,
} from './entityWire.mapper';
import { isStoredEntityType } from '../models/entity';
import { isPlainObject, readFiniteNumber, readString } from '../utils/record';

const LOCAL_ENTITY_TYPES: readonly StoredEntityType[] = [
  'polygon',
  'line',
  'rectangle',
  'circle',
  'ellipse',
  'sector',
  'marker',
  'target',
];

function isLocalEntityType(value: string): value is StoredEntityType {
  return (LOCAL_ENTITY_TYPES as readonly string[]).includes(value);
}

function inferEntityType(raw: unknown): StoredEntityType | null {
  const fromServer = toLocalEntityType(String(raw ?? ''));
  if (fromServer && isStoredEntityType(fromServer)) {
    return fromServer;
  }
  const lower = String(raw ?? '').trim().toLowerCase();
  if (isLocalEntityType(lower)) {
    return lower;
  }
  const upper = String(raw ?? '').trim().toUpperCase();
  if (upper === 'MARKER' || upper === 'POINT') {
    return 'marker';
  }
  if (upper === 'RECTANGLE') {
    return 'rectangle';
  }
  if (upper === 'CIRCLE') {
    return 'circle';
  }
  return null;
}

function readMarkerCoordinates(record: Record<string, unknown>): { lat: number; lng: number }[] {
  const lat = readFiniteNumber(record.lat ?? record.latitude);
  const lng = readFiniteNumber(record.lng ?? record.longitude);
  if (lat === undefined || lng === undefined) {
    return [];
  }
  return [{ lat, lng }];
}

function readEntityProperties(
  raw: unknown,
): Record<string, string | number | boolean | undefined> {
  if (!isPlainObject(raw)) {
    return {};
  }
  const out: Record<string, string | number | boolean | undefined> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === undefined
    ) {
      out[key] = value;
    }
  }
  return out;
}

export function normalizeRawEntityToStore(raw: unknown): TacticalEntity | null {
  if (!isPlainObject(raw)) {
    return null;
  }

  const id = readString(raw, 'id');
  if (!id) {
    return null;
  }

  const type = inferEntityType(raw.type);
  if (!type || type === 'target') {
    return null;
  }

  let coords = normalizeCoordinates(raw.coordinates);
  if (coords.length === 0 && isPlainObject(raw.geometry)) {
    coords = normalizeCoordinates(raw.geometry.coordinates);
  }

  if (coords.length === 0 && type !== 'marker') {
    return null;
  }

  if (type === 'marker' && coords.length === 0) {
    coords = readMarkerCoordinates(raw);
  }

  if (coords.length === 0) {
    return null;
  }

  const category = toLocalEntityCategory(raw.category ?? EntityCategoryEnum.FREE);
  const name = readString(raw, 'name') || id;
  const color = readString(raw, 'color') || '#3388ff';
  const properties = readEntityProperties(raw.properties);

  const transparencyRaw = readFiniteNumber(raw.transparency);
  let transparency = transparencyRaw ?? 0.3;
  if (transparency > 1) {
    transparency = transparency / 100;
  }
  if (transparency < 0) {
    transparency = 0;
  }
  if (transparency > 1) {
    transparency = 1;
  }

  const geometry =
    isPlainObject(raw.geometry) && typeof raw.geometry.type === 'string'
      ? {
          type: String(raw.geometry.type),
          coordinates: raw.geometry.coordinates as number[] | number[][] | number[][][],
        }
      : buildGeometryForCreate(type, coords);

  const entity = buildTacticalEntity(id, name, category, type, coords, {
    transparency,
    properties,
  });

  return {
    ...entity,
    color,
    visible: raw.visible !== false,
    geometry,
    createdAt: readFiniteNumber(raw.createdAt) ?? entity.createdAt,
    updatedAt: readFiniteNumber(raw.updatedAt) ?? entity.updatedAt,
  };
}
