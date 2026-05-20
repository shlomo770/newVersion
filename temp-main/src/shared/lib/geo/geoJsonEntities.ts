import type { TacticalEntity } from '@domain/models/entity';
import type { Coordinates } from './types';
import { closeRing, toLngLatPairs } from './rings';
import { createCirclePolygon, createEllipsePolygon } from './polygons';

type GeoJSONPoint = { type: 'Point'; coordinates: [number, number] };
type GeoJSONLineString = { type: 'LineString'; coordinates: [number, number][] };
type GeoJSONPolygon = { type: 'Polygon'; coordinates: [[number, number][]] };

type GeoJSONFeature = {
  type: 'Feature';
  id?: string | number;
  properties: Record<string, unknown>;
  geometry: GeoJSONPoint | GeoJSONLineString | GeoJSONPolygon;
};

export type GeoJSONFeatureCollection = {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
};

export function convertEntitiesToGeoJSON(entities: TacticalEntity[]): GeoJSONFeatureCollection {
  const features: GeoJSONFeature[] = entities.map((entity) => {
    const kind = entity.type.toLowerCase().trim();
    let geometry: GeoJSONFeature['geometry'];

    switch (kind) {
      case 'polygon':
      case 'rectangle': {
        const ring = closeRing(entity.coordinates as Coordinates[]);
        geometry = { type: 'Polygon', coordinates: [toLngLatPairs(ring)] };
        break;
      }
      case 'line':
      case 'polyline': {
        const line = entity.coordinates as Coordinates[];
        if (line.length < 2) {
          throw new Error(`Line entity ${entity.id} must have at least 2 points`);
        }
        geometry = { type: 'LineString', coordinates: toLngLatPairs(line) };
        break;
      }
      case 'circle': {
        const pts = entity.coordinates as Coordinates[];
        if (pts.length >= 2) {
          const ring = createCirclePolygon(pts[0], pts[1], 2);
          geometry = { type: 'Polygon', coordinates: [toLngLatPairs(ring)] };
        } else if (pts.length === 1) {
          geometry = { type: 'Point', coordinates: [pts[0].lng, pts[0].lat] };
        } else {
          throw new Error(`Circle entity ${entity.id} requires at least center`);
        }
        break;
      }
      case 'ellipse': {
        const pts = entity.coordinates as Coordinates[];
        if (pts.length >= 2) {
          const ring = createEllipsePolygon(pts[0], pts[1], 2);
          geometry = { type: 'Polygon', coordinates: [toLngLatPairs(ring)] };
        } else {
          throw new Error(`Ellipse entity ${entity.id} requires center & edge`);
        }
        break;
      }
      case 'marker':
      case 'point': {
        const coords = entity.coordinates as Coordinates[];
        if (coords.length === 0) {
          throw new Error(`Marker entity ${entity.id} has no coordinates`);
        }
        const p = coords[0];
        geometry = { type: 'Point', coordinates: [p.lng, p.lat] };
        break;
      }
      default:
        throw new Error(`Unsupported entity type: ${entity.type}`);
    }

    return {
      type: 'Feature',
      id: entity.id,
      geometry,
      properties: {
        id: entity.id,
        type: entity.type,
        ...entity.properties,
      },
    };
  });

  return { type: 'FeatureCollection', features };
}
