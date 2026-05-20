import type { Coordinates } from './coordinates';

export const MAP_TYPES = [
  { id: 'vector-global', name: 'Vector', icon: '🌍', type: 'vector' },
  { id: 'satellite-raster', name: 'Satellite', icon: '🛰', type: 'raster' },
  { id: 'osm-raster', name: 'OSM Raster', icon: '🗺', type: 'raster' },
  { id: 'carto-dark', name: 'Carto Dark', icon: '🌑', type: 'vector' },
  { id: 'carto-light', name: 'Carto Light', icon: '🌕', type: 'vector' },
] as const;

export type MapTypeId = (typeof MAP_TYPES)[number]['id'];
export type MapLayerKind = (typeof MAP_TYPES)[number]['type'];

export const mapTypes = MAP_TYPES;
export const mapTypesSelected = MAP_TYPES;
export type MapTypesSelector = typeof MAP_TYPES;

export interface MapState {
  rotation: number;
  brightness: number;
  center: Coordinates;
  zoom: number;
  selectedMapType: string;
}
