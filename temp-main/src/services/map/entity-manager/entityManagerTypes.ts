import type { Feature, Geometry } from 'geojson';
import type { EntityType, GeoJsonGeometry, TacticalEntity } from '@domain/models/entity';
import type { Coordinates } from '@domain/models/coordinates';

/** Entity payload accepted by map layer sync (store entities + transient draw previews). */
export type MapLayerEntity = TacticalEntity & {
  width?: number;
  style?: {
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    fillOpacity?: number;
    strokeOpacity?: number;
    radius?: number;
  };
};

export type EntityGeoJsonFeature = Feature<
  Geometry,
  {
    id?: string;
    type?: EntityType;
    name?: string;
    category?: string;
    color?: string;
    transparency?: number;
    iconImage?: string;
    error?: string;
    [key: string]: unknown;
  }
>;

export type EntityGeoJsonInput = {
  type: GeoJsonGeometry['type'];
  coordinates: GeoJsonGeometry['coordinates'];
};

export type CoordLike = Coordinates | [number, number];

export function resolveEntityTransparency(entity: MapLayerEntity): number | undefined {
  if (entity.type === 'marker') return entity.style?.fillOpacity;
  return entity.transparency;
}
