import type { DrawableEntityType, EntityType, StoredEntityType } from './entityBase';
import type {
  AreaEntity,
  CircleEntity,
  EllipseEntity,
  FilledTacticalEntity,
  LineEntity,
  MarkerEntity,
  PolygonEntity,
  RectangleEntity,
  SectorEntity,
  TacticalEntity,
  TargetEntity,
} from './entityVariants';

export function isMarkerEntity(entity: TacticalEntity): entity is MarkerEntity {
  return entity.type === 'marker';
}

export function isLineEntity(entity: TacticalEntity): entity is LineEntity {
  return entity.type === 'line';
}

export function isPolygonEntity(entity: TacticalEntity): entity is PolygonEntity {
  return entity.type === 'polygon';
}

export function isRectangleEntity(entity: TacticalEntity): entity is RectangleEntity {
  return entity.type === 'rectangle';
}

export function isCircleEntity(entity: TacticalEntity): entity is CircleEntity {
  return entity.type === 'circle';
}

export function isEllipseEntity(entity: TacticalEntity): entity is EllipseEntity {
  return entity.type === 'ellipse';
}

export function isSectorEntity(entity: TacticalEntity): entity is SectorEntity {
  return entity.type === 'sector';
}

export function isTargetEntity(entity: TacticalEntity): entity is TargetEntity {
  return entity.type === 'target';
}

export function isAreaEntity(entity: TacticalEntity): entity is AreaEntity {
  return (
    isPolygonEntity(entity) ||
    isRectangleEntity(entity) ||
    isCircleEntity(entity) ||
    isEllipseEntity(entity) ||
    isSectorEntity(entity)
  );
}

export function hasTransparency(entity: TacticalEntity): entity is FilledTacticalEntity {
  return entity.type !== 'marker';
}

export function isDrawableEntityType(type: EntityType): type is DrawableEntityType {
  return (
    type === 'polygon' ||
    type === 'line' ||
    type === 'rectangle' ||
    type === 'circle' ||
    type === 'ellipse' ||
    type === 'sector' ||
    type === 'marker'
  );
}

export function isStoredEntityType(type: EntityType): type is StoredEntityType {
  return type !== 'measure' && type !== 'measure-area';
}

export function parseDrawableEntityType(type: string): DrawableEntityType | null {
  switch (type) {
    case 'marker':
    case 'line':
    case 'polygon':
    case 'rectangle':
    case 'circle':
    case 'ellipse':
    case 'sector':
      return type;
    default:
      return null;
  }
}
