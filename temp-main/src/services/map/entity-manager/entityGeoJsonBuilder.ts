import {
  createCirclePolygon,
  createEllipsePolygon,
  createSectorPolygon,
} from '@shared/lib/geo';
import { closePolygonCoordinates } from '@domain/utils/polygon';
import type { EntityType } from '@domain/models/entity';
import type { Coordinates } from '@domain/models/coordinates';
import type { EntityGeoJsonFeature, MapLayerEntity } from './entityManagerTypes';
import { resolveEntityTransparency } from './entityManagerTypes';

function isValidCoord(coord: Coordinates | undefined): coord is Coordinates {
  return Boolean(coord && typeof coord.lng === 'number' && typeof coord.lat === 'number');
}

function createMarkerGeoJSON(entity: MapLayerEntity): EntityGeoJsonFeature {
  const firstCoord = entity.coordinates[0];
  if (!isValidCoord(firstCoord)) {
    console.error('❌ Invalid marker coordinates:', entity.coordinates);
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { category: 'Other', error: 'Invalid marker coordinates' },
    };
  }

  return {
    type: 'Feature',
    id: entity.id,
    geometry: {
      type: 'Point',
      coordinates: [firstCoord.lng, firstCoord.lat],
    },
    properties: {
      ...(entity.properties || {}),
      id: entity.id,
      type: entity.type,
      category: String(entity.properties?.category || 'Other'),
    },
  };
}

function createLineGeoJSON(entity: MapLayerEntity): EntityGeoJsonFeature {
  const validCoords = entity.coordinates.filter(isValidCoord);

  if (validCoords.length < 2) {
    console.error('❌ Invalid line coordinates (need at least 2 valid points):', entity.coordinates);
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { category: 'Other', error: 'Invalid line coordinates' },
    };
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: validCoords.map((coord) => [coord.lng, coord.lat]),
    },
    properties: {
      ...(entity.properties || {}),
      category: String(entity.properties?.category || 'Other'),
    },
  };
}

function createCircleGeoJSON(entity: MapLayerEntity): EntityGeoJsonFeature {
  const validCoords = entity.coordinates.filter(isValidCoord);

  if (validCoords.length < 2) {
    console.error('❌ Invalid circle coordinates (need center and edge point):', entity.coordinates);
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { category: 'Other', error: 'Invalid circle coordinates' },
    };
  }

  const center = validCoords[0];
  const edge = validCoords[1];
  const circleCoords = createCirclePolygon(center, edge, 64);

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [circleCoords.map((coord) => [coord.lng, coord.lat])],
    },
    properties: {
      ...(entity.properties || {}),
      category: String(entity.properties?.category || 'Other'),
    },
  };
}

function createEllipseGeoJSON(entity: MapLayerEntity): EntityGeoJsonFeature {
  const validCoords = entity.coordinates.filter(isValidCoord);

  if (validCoords.length < 2) {
    console.error('❌ Invalid ellipse coordinates (need center and edge point):', entity.coordinates);
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { category: 'Other', error: 'Invalid ellipse coordinates' },
    };
  }

  const center = validCoords[0];
  const edge = validCoords[1];
  const ellipseCoords = createEllipsePolygon(center, edge, 64);

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [ellipseCoords.map((coord) => [coord.lng, coord.lat])],
    },
    properties: {
      ...(entity.properties || {}),
      category: String(entity.properties?.category || 'Other'),
    },
  };
}

function createSectorGeoJSON(entity: MapLayerEntity): EntityGeoJsonFeature {
  const validCoords = entity.coordinates.filter(isValidCoord);

  if (validCoords.length < 3) {
    console.error('❌ Invalid sector coordinates (need center and 2 angle points):', entity.coordinates);
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { category: 'Other', error: 'Invalid sector coordinates' },
    };
  }

  const center = validCoords[0];
  const startPoint = validCoords[1];
  const endPoint = validCoords[2];
  const sectorCoords = createSectorPolygon(center, startPoint, endPoint, 32);

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [sectorCoords.map((coord) => [coord.lng, coord.lat])],
    },
    properties: {
      ...(entity.properties || {}),
      category: String(entity.properties?.category || 'Other'),
    },
  };
}

function createPolygonGeoJSON(entity: MapLayerEntity): EntityGeoJsonFeature {
  const validCoords = entity.coordinates.filter(isValidCoord);

  if (validCoords.length < 3) {
    console.error('❌ Invalid polygon coordinates (need at least 3 valid points):', entity.coordinates);
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { category: 'Other', error: 'Invalid polygon coordinates' },
    };
  }

  const closedCoords = closePolygonCoordinates(validCoords);
  const polygonCoords = closedCoords.map((coord) => [coord.lng, coord.lat]);
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [polygonCoords],
    },
    properties: {
      ...(entity.properties || {}),
      category: String(entity.properties?.category || 'Other'),
    },
  };
}

export function buildEntityFeatureFromGeometry(entity: MapLayerEntity): EntityGeoJsonFeature {
  return {
    type: 'Feature',
    geometry: entity.geometry as EntityGeoJsonFeature['geometry'],
    properties: {
      id: entity.id,
      type: entity.type,
      name: entity.name,
      category: String(entity.category),
      color: entity.color,
      transparency: resolveEntityTransparency(entity),
    },
  };
}

export function convertEntityToGeoJSON(entity: MapLayerEntity): EntityGeoJsonFeature {
  if (!entity.coordinates || !Array.isArray(entity.coordinates) || entity.coordinates.length === 0) {
    console.error('❌ Invalid entity coordinates:', entity);
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { category: 'Other', error: 'Invalid coordinates' },
    };
  }

  switch (entity.type) {
    case 'marker':
    case 'target':
      return createMarkerGeoJSON(entity);
    case 'line':
      return createLineGeoJSON(entity);
    case 'circle':
      return createCircleGeoJSON(entity);
    case 'ellipse':
      return createEllipseGeoJSON(entity);
    case 'sector':
      return createSectorGeoJSON(entity);
    case 'polygon':
    case 'rectangle':
      return createPolygonGeoJSON(entity);
      default:
      throw new Error('Unknown entity type');
  }
}

export function resolveEntityGeoJson(entity: MapLayerEntity): EntityGeoJsonFeature {
  if (entity.geometry && typeof entity.geometry === 'object' && 'type' in entity.geometry) {
    return buildEntityFeatureFromGeometry(entity);
  }
  return convertEntityToGeoJSON(entity);
}

export function getLayerTypeForEntity(entityType: EntityType): 'circle' | 'line' | 'fill' | 'symbol' {
  switch (entityType) {
    case 'marker':
    case 'target':
      return 'circle';
    case 'line':
      return 'line';
    case 'polygon':
    case 'rectangle':
    case 'circle':
    case 'ellipse':
    case 'sector':
      return 'fill';
    default:
      return 'circle';
  }
}
