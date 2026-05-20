export type {
  EntityType,
  StoredEntityType,
  DrawableEntityType,
  EntityStyle,
  GeoJsonGeometry,
  EntityCore,
  DrawingMode,
} from './entity/entityBase';

export type {
  MarkerEntityProperties,
  MarkerEntity,
  LineEntityProperties,
  LineEntity,
  AreaEntityProperties,
  PolygonEntity,
  RectangleEntity,
  CircleEntity,
  EllipseEntity,
  SectorEntity,
  TargetEntity,
  AreaEntity,
  FilledTacticalEntity,
  TacticalEntity,
} from './entity/entityVariants';

export type { EntityDrawDraft } from './entity/entityDraft';

export {
  isMarkerEntity,
  isLineEntity,
  isPolygonEntity,
  isRectangleEntity,
  isCircleEntity,
  isEllipseEntity,
  isSectorEntity,
  isTargetEntity,
  isAreaEntity,
  hasTransparency,
  isDrawableEntityType,
  isStoredEntityType,
  parseDrawableEntityType,
} from './entity/entityGuards';

export { mergeEntityUpdate, type EntityUpdatePatch } from './entity/entityMerge';

export {
  buildMarkerEntity,
  buildLineEntity,
  buildPolygonEntity,
  buildRectangleEntity,
  buildCircleEntity,
  buildEllipseEntity,
  buildSectorEntity,
  buildTacticalEntity,
  buildNewEntity,
  tacticalEntityFromDrawDraft,
} from './entity/entityFactory';

/** Alias used across Redux and map hooks. */
export type { TacticalEntity as Entity } from './entity/entityVariants';
