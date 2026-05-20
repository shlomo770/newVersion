import type { Feature, FeatureCollection, Geometry, LineString, Point, Polygon, Position } from 'geojson';

export const EMPTY_FEATURE_COLLECTION: FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

export type LngLatTuple = [number, number];
export type LngLatAltTuple = [number, number, number];

export function pointCoordinates(lng: number, lat: number): Position {
  return [lng, lat];
}

export function lineStringCoordinates(coords: LngLatTuple[]): LineString['coordinates'] {
  return coords;
}

export function polygonRingCoordinates(ring: LngLatTuple[]): Polygon['coordinates'] {
  return [ring];
}

export function pointFeature<P extends GeoJSON.GeoJsonProperties = GeoJSON.GeoJsonProperties>(
  lng: number,
  lat: number,
  properties: P,
): Feature<Point, P> {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: pointCoordinates(lng, lat),
    },
    properties,
  };
}

export function lineStringFeature<P extends GeoJSON.GeoJsonProperties = GeoJSON.GeoJsonProperties>(
  coordinates: LngLatTuple[],
  properties: P,
): Feature<LineString, P> {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: lineStringCoordinates(coordinates),
    },
    properties,
  };
}

export function polygonFeature(
  ring: LngLatTuple[],
  properties: GeoJSON.GeoJsonProperties = {},
): Feature<Polygon> {
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: polygonRingCoordinates(ring),
    },
    properties,
  };
}

export function featureCollection(
  features: Feature<Geometry>[],
): FeatureCollection<Geometry> {
  return {
    type: 'FeatureCollection',
    features,
  };
}
