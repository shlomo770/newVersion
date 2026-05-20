import { EntityCategoryEnum } from '../../enums/entity.enum';
import type { Coordinates } from '../coordinates';
import { buildGeometryForCreate } from '../../mappers/entityGeometry.mapper';
import type { DrawableEntityType, EntityCore, GeoJsonGeometry } from './entityBase';
import type { EntityDrawDraft } from './entityDraft';
import type {
  CircleEntity,
  EllipseEntity,
  LineEntity,
  MarkerEntity,
  PolygonEntity,
  RectangleEntity,
  SectorEntity,
  TacticalEntity,
} from './entityVariants';

function defaultColorForCategory(category: EntityCategoryEnum): string {
  if (category === EntityCategoryEnum.WCO_HOLD) return '#ff0000';
  if (category === EntityCategoryEnum.WCO_FREE) return '#25ff00';
  return '#3b82f6';
}

function coreFields(
  id: string,
  name: string,
  category: EntityCategoryEnum,
  coordinates: Coordinates[],
  geometry: GeoJsonGeometry,
): EntityCore {
  const now = Date.now();
  return {
    id,
    name,
    color: defaultColorForCategory(category),
    category,
    visible: true,
    coordinates,
    geometry,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildMarkerEntity(
  id: string,
  name: string,
  category: EntityCategoryEnum,
  coordinates: Coordinates[],
  properties: MarkerEntity['properties'] = {},
): MarkerEntity {
  return {
    ...coreFields(id, name, category, coordinates, buildGeometryForCreate('marker', coordinates)),
    type: 'marker',
    properties,
  };
}

export function buildLineEntity(
  id: string,
  name: string,
  category: EntityCategoryEnum,
  coordinates: Coordinates[],
  transparency = 0.3,
  properties: LineEntity['properties'] = {},
  width?: number,
): LineEntity {
  return {
    ...coreFields(id, name, category, coordinates, buildGeometryForCreate('line', coordinates)),
    type: 'line',
    transparency,
    properties,
    width,
  };
}

export function buildPolygonEntity(
  id: string,
  name: string,
  category: EntityCategoryEnum,
  coordinates: Coordinates[],
  transparency = 0.3,
  properties: PolygonEntity['properties'] = {},
): PolygonEntity {
  return {
    ...coreFields(id, name, category, coordinates, buildGeometryForCreate('polygon', coordinates)),
    type: 'polygon',
    transparency,
    properties,
  };
}

export function buildRectangleEntity(
  id: string,
  name: string,
  category: EntityCategoryEnum,
  coordinates: Coordinates[],
  transparency = 0.3,
  properties: RectangleEntity['properties'] = {},
): RectangleEntity {
  return {
    ...coreFields(id, name, category, coordinates, buildGeometryForCreate('rectangle', coordinates)),
    type: 'rectangle',
    transparency,
    properties,
  };
}

export function buildCircleEntity(
  id: string,
  name: string,
  category: EntityCategoryEnum,
  coordinates: Coordinates[],
  transparency = 0.3,
  properties: CircleEntity['properties'] = {},
): CircleEntity {
  return {
    ...coreFields(id, name, category, coordinates, buildGeometryForCreate('circle', coordinates)),
    type: 'circle',
    transparency,
    properties,
  };
}

export function buildEllipseEntity(
  id: string,
  name: string,
  category: EntityCategoryEnum,
  coordinates: Coordinates[],
  transparency = 0.3,
  properties: EllipseEntity['properties'] = {},
): EllipseEntity {
  return {
    ...coreFields(id, name, category, coordinates, buildGeometryForCreate('ellipse', coordinates)),
    type: 'ellipse',
    transparency,
    properties,
  };
}

export function buildSectorEntity(
  id: string,
  name: string,
  category: EntityCategoryEnum,
  coordinates: Coordinates[],
  transparency = 0.3,
  properties: SectorEntity['properties'] = {},
): SectorEntity {
  return {
    ...coreFields(id, name, category, coordinates, buildGeometryForCreate('sector', coordinates)),
    type: 'sector',
    transparency,
    properties,
  };
}

export function buildTacticalEntity(
  id: string,
  name: string,
  category: EntityCategoryEnum,
  type: DrawableEntityType,
  coordinates: Coordinates[],
  options?: {
    transparency?: number;
    width?: number;
    properties?: Record<string, string | number | boolean | undefined>;
  },
): TacticalEntity {
  const transparency = options?.transparency ?? 0.3;
  const properties = options?.properties ?? {};

  switch (type) {
    case 'marker':
      return buildMarkerEntity(id, name, category, coordinates, {
        iconChar: typeof properties.iconChar === 'string' ? properties.iconChar : undefined,
        category: typeof properties.category === 'string' ? properties.category : undefined,
      });
    case 'line':
      return buildLineEntity(id, name, category, coordinates, transparency, properties, options?.width);
    case 'polygon':
      return buildPolygonEntity(id, name, category, coordinates, transparency, properties);
    case 'rectangle':
      return buildRectangleEntity(id, name, category, coordinates, transparency, properties);
    case 'circle':
      return buildCircleEntity(id, name, category, coordinates, transparency, properties);
    case 'ellipse':
      return buildEllipseEntity(id, name, category, coordinates, transparency, properties);
    case 'sector':
      return buildSectorEntity(id, name, category, coordinates, transparency, properties);
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}

/** @deprecated Use `buildTacticalEntity` — kept for existing call sites. */
export function buildNewEntity(
  id: string,
  name: string,
  category: EntityCategoryEnum,
  type: DrawableEntityType,
  coordinates: Coordinates[],
  extraProperties?: Record<string, unknown>,
): TacticalEntity {
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
}

export function tacticalEntityFromDrawDraft(
  id: string,
  name: string,
  category: EntityCategoryEnum,
  draft: EntityDrawDraft,
): TacticalEntity {
  if (draft.type === 'marker') {
    return buildMarkerEntity(id, name, category, draft.coordinates, draft.properties);
  }
  if (draft.type === 'line') {
    return buildLineEntity(id, name, category, draft.coordinates, 0.3, draft.properties);
  }
  const areaProps = draft.properties ?? {};
  return buildTacticalEntity(id, name, category, draft.type, draft.coordinates, {
    properties: {
      category: areaProps.category,
    },
  });
}
