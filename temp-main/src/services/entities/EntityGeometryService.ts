import type { Coordinates } from '@domain/models/coordinates';
import type { DrawableEntityType, TacticalEntity } from '@domain/models/entity';
import { buildTacticalEntity, parseDrawableEntityType } from '@domain/models/entity';
import { EntityCategoryEnum } from '@domain/enums/entity.enum';
import {
  buildGeometryForCreate,
  buildGeometryForUpdate,
} from '@domain/mappers/entityGeometry.mapper';
import { openPolygonCoordinates, closePolygonCoordinates } from '@domain/utils/polygon';

export { closePolygonCoordinates, openPolygonCoordinates };
export { buildGeometryForCreate, buildGeometryForUpdate };

export const buildNewEntity = (
  id: string,
  name: string,
  category: EntityCategoryEnum,
  type: DrawableEntityType,
  coordinates: Coordinates[],
  extraProperties?: Record<string, unknown>,
): TacticalEntity => {
  const properties: Record<string, string | number | boolean | undefined> = {};
  if (extraProperties) {
    for (const [key, value] of Object.entries(extraProperties)) {
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        value === undefined
      ) {
        properties[key] = value;
      }
    }
  }
  return buildTacticalEntity(id, name, category, type, coordinates, { properties });
};

export function buildNewEntityFromType(
  id: string,
  name: string,
  category: EntityCategoryEnum,
  type: string,
  coordinates: Coordinates[],
  extraProperties?: Record<string, unknown>,
): TacticalEntity | null {
  const drawable = parseDrawableEntityType(type);
  if (!drawable) {
    return null;
  }
  return buildNewEntity(id, name, category, drawable, coordinates, extraProperties);
}
