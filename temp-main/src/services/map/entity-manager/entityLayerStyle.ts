import type { Map as MaplibreMap } from 'maplibre-gl';
import { createMarkerIconImageData, getMarkerIconImageId } from '@/constants/markerIcons';
import { hasTransparency } from '@domain/models/entity';
import type { EntityType, MarkerEntityProperties } from '@domain/models/entity';
import type { MapLayerEntity } from './entityManagerTypes';

export type EntityLayerPaint = Record<string, string | number | boolean | maplibregl.ExpressionSpecification>;

export function ensureMarkerIconImage(
  map: MaplibreMap,
  code: string,
  addedIconImages: Set<string>,
): void {
  const id = getMarkerIconImageId(code);
  if (map.hasImage(id)) return;
  try {
    const img = createMarkerIconImageData(code);
    map.addImage(id, { width: img.width, height: img.height, data: img.data }, { pixelRatio: 2 });
    addedIconImages.add(id);
  } catch {
    /* ignore duplicate or invalid icon payloads */
  }
}

export function getPaintProperties(entity: MapLayerEntity): EntityLayerPaint {
  const style = entity.style || {};

  try {
    const entityColor =
      entity.color ||
      style.fillColor ||
      (entity.type === 'sector' && entity.name === 'TABOOZONE' ? '#FFB300' : undefined) ||
      '#3b82f6';

    const entityTransparency = hasTransparency(entity)
      ? entity.transparency
      : style.fillOpacity ?? 0.3;

    if (entity.type === 'marker') {
      const circleOpacity = Math.min(1, Math.max(0, entityTransparency));
      return {
        'circle-radius': 8,
        'circle-color': entityColor,
        'circle-stroke-color': style.strokeColor || '#1e40af',
        'circle-stroke-width': style.strokeWidth || 2,
        'circle-opacity': circleOpacity,
      };
    }

    if (entity.type === 'target') {
      return {
        'circle-radius': 40,
        'circle-color': '#ff0000',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 4,
      };
    }

    if (entity.type === 'line') {
      const lineOpacity = Math.min(1, Math.max(0, entityTransparency));
      return {
        'line-color': entityColor,
        'line-width': style.strokeWidth || entity.width || 2,
        'line-opacity': lineOpacity,
      };
    }

    if (
      entity.type === 'polygon' ||
      entity.type === 'rectangle' ||
      entity.type === 'circle' ||
      entity.type === 'ellipse' ||
      entity.type === 'sector'
    ) {
      return {
        'fill-color': entityColor,
        'fill-opacity': entityTransparency,
        'fill-outline-color': style.strokeColor || '#1e40af',
      };
    }

    return {};
  } catch (error) {
    console.error('❌ Error in getPaintProperties:', error, entity);
    return {
      'fill-color': '#3b82f6',
      'fill-opacity': 0.3,
      'fill-outline-color': '#1e40af',
    };
  }
}

export type IconMarkerEntity = MapLayerEntity & {
  type: 'marker';
  properties: MarkerEntityProperties & { iconChar: string };
};

export function isIconMarkerEntity(entity: MapLayerEntity): entity is IconMarkerEntity {
  return entity.type === 'marker' && typeof entity.properties?.iconChar === 'string' && entity.properties.iconChar.length > 0;
}

export function buildIconMarkerFeature(
  entity: IconMarkerEntity,
): {
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: { iconImage: string };
} | null {
  if (!entity.coordinates[0]) return null;
  const coord = entity.coordinates[0];
  const code = entity.properties.iconChar;
  return {
    geometry: { type: 'Point', coordinates: [coord.lng, coord.lat] },
    properties: { iconImage: getMarkerIconImageId(code) },
  };
}

export function getIconMarkerLayout(): maplibregl.SymbolLayerSpecification['layout'] {
  return {
    'icon-image': ['get', 'iconImage'],
    'icon-size': 1.8,
    'icon-anchor': 'center',
    'icon-allow-overlap': true,
  };
}

export type SupportedFillEntityType = Extract<
  EntityType,
  'polygon' | 'rectangle' | 'circle' | 'ellipse' | 'sector' | 'line'
>;

export const LABEL_ENTITY_TYPES: SupportedFillEntityType[] = [
  'polygon',
  'rectangle',
  'circle',
  'ellipse',
  'sector',
  'line',
];
