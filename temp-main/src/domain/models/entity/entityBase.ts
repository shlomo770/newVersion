import type { EntityCategoryEnum } from '../../enums/entity.enum';
import type { Coordinates } from '../coordinates';

/** All entity kinds referenced in the app (including transient draw modes). */
export type EntityType =
  | 'polygon'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'ellipse'
  | 'sector'
  | 'marker'
  | 'target'
  | 'measure'
  | 'measure-area';

/** Entity types persisted on the map / in Redux. */
export type StoredEntityType = Exclude<EntityType, 'measure' | 'measure-area'>;

export type DrawableEntityType = Exclude<StoredEntityType, 'target'>;

export interface EntityStyle {
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  strokeOpacity?: number;
  radius?: number;
}

export interface GeoJsonGeometry {
  type: string;
  coordinates: number[] | number[][] | number[][][];
}

export interface EntityCore {
  id: string;
  name: string;
  color: string;
  category: EntityCategoryEnum;
  visible: boolean;
  coordinates: Coordinates[];
  geometry: GeoJsonGeometry;
  createdAt: number;
  updatedAt: number;
}

export type DrawingMode = EntityType | 'measure' | 'measure-area' | null;
