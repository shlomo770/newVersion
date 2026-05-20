import type { TacticalEntity } from './entityVariants';
import { hasTransparency, isMarkerEntity, isTargetEntity } from './entityGuards';

export type EntityUpdatePatch = {
  id?: string;
  type?: TacticalEntity['type'];
  name?: string;
  color?: string;
  category?: TacticalEntity['category'];
  visible?: boolean;
  coordinates?: TacticalEntity['coordinates'];
  geometry?: TacticalEntity['geometry'];
  createdAt?: number;
  updatedAt?: number;
  transparency?: number;
  width?: number;
  properties?: TacticalEntity['properties'];
};

function normalizeTransparency(value: number): number {
  let transparency = value;
  if (transparency > 1) transparency = transparency / 100;
  if (transparency < 0) transparency = 0;
  if (transparency > 1) transparency = 1;
  return transparency;
}

/** Merge a partial patch into an existing entity without breaking the discriminated union. */
export function mergeEntityUpdate(entity: TacticalEntity, updates: EntityUpdatePatch): TacticalEntity {
  const shared = {
    name: updates.name ?? entity.name,
    color: updates.color ?? entity.color,
    category: updates.category ?? entity.category,
    visible: updates.visible ?? entity.visible,
    coordinates: updates.coordinates ?? entity.coordinates,
    geometry: updates.geometry ?? entity.geometry,
    createdAt: updates.createdAt ?? entity.createdAt,
    updatedAt: Date.now(),
  };

  if (isMarkerEntity(entity)) {
    return {
      ...entity,
      ...shared,
      type: 'marker',
      properties: updates.properties ?? entity.properties,
    };
  }

  if (hasTransparency(entity)) {
    let transparency = entity.transparency;
    if (typeof updates.transparency === 'number' && !Number.isNaN(updates.transparency)) {
      transparency = normalizeTransparency(updates.transparency);
    }

    if (entity.type === 'line') {
      return {
        ...entity,
        ...shared,
        type: 'line',
        transparency,
        width: typeof updates.width === 'number' ? updates.width : entity.width,
        properties: updates.properties ?? entity.properties,
      };
    }

    if (isTargetEntity(entity)) {
      const properties =
        updates.properties !== undefined
          ? { ...entity.properties, ...updates.properties }
          : entity.properties;
      return {
        ...entity,
        ...shared,
        type: 'target',
        transparency,
        properties,
      };
    }

    return {
      ...entity,
      ...shared,
      type: entity.type,
      transparency,
      properties: updates.properties ?? entity.properties,
    };
  }

  return entity;
}
