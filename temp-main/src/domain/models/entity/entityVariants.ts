import type { EntityCore } from './entityBase';

export interface MarkerEntityProperties {
  iconChar?: string;
  category?: string;
}

export interface MarkerEntity extends EntityCore {
  type: 'marker';
  properties: MarkerEntityProperties;
}

export interface LineEntityProperties {
  category?: string;
}

export interface LineEntity extends EntityCore {
  type: 'line';
  transparency: number;
  width?: number;
  properties: LineEntityProperties;
}

export interface AreaEntityProperties {
  category?: string;
}

/** Polygon, rectangle, circle, ellipse, and sector share fill styling. */
export interface PolygonEntity extends EntityCore {
  type: 'polygon';
  transparency: number;
  properties: AreaEntityProperties;
}

export interface RectangleEntity extends EntityCore {
  type: 'rectangle';
  transparency: number;
  properties: AreaEntityProperties;
}

export interface CircleEntity extends EntityCore {
  type: 'circle';
  transparency: number;
  properties: AreaEntityProperties;
}

export interface EllipseEntity extends EntityCore {
  type: 'ellipse';
  transparency: number;
  properties: AreaEntityProperties;
}

export interface SectorEntity extends EntityCore {
  type: 'sector';
  transparency: number;
  properties: AreaEntityProperties;
}

export interface TargetEntity extends EntityCore {
  type: 'target';
  transparency: number;
  properties: Record<string, string | number | boolean | undefined>;
}

export type AreaEntity =
  | PolygonEntity
  | RectangleEntity
  | CircleEntity
  | EllipseEntity
  | SectorEntity;

export type FilledTacticalEntity = AreaEntity | LineEntity | TargetEntity;

export type TacticalEntity =
  | MarkerEntity
  | LineEntity
  | PolygonEntity
  | RectangleEntity
  | CircleEntity
  | EllipseEntity
  | SectorEntity
  | TargetEntity;
