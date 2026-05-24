import type { Map as MaplibreMap } from 'maplibre-gl';
import { createMarkerIconImageData, getMarkerIconImageId } from '@/constants/markerIcons';
import { hasTransparency } from '@domain/models/entity';
import type { EntityType, MarkerEntityProperties } from '@domain/models/entity';
import { ENTITY_PAINT_DEFAULTS } from '@features/map/config';
import type { MapLayerEntity } from './entityManagerTypes';

export type EntityLayerPaint = Record<string, string | number | boolean | maplibregl.ExpressionSpecification>;

/** MapLibre pixelRatio used when registering generated marker icons. */
const MARKER_ICON_PIXEL_RATIO = 2;
const TABOO_ENTITY_NAME = 'TABOOZONE';

export function ensureMarkerIconImage(
  map: MaplibreMap,
  code: string,
  addedIconImages: Set<string>,
): void {
  const id = getMarkerIconImageId(code);
  if (map.hasImage(id)) return;
  try {
    const img = createMarkerIconImageData(code);
    map.addImage(
      id,
      { width: img.width, height: img.height, data: img.data },
      { pixelRatio: MARKER_ICON_PIXEL_RATIO },
    );
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
      (entity.type === 'sector' && entity.name === TABOO_ENTITY_NAME
        ? ENTITY_PAINT_DEFAULTS.tabooZoneColor
        : undefined) ||
      ENTITY_PAINT_DEFAULTS.color;

    const entityTransparency = hasTransparency(entity)
      ? entity.transparency
      : style.fillOpacity ?? ENTITY_PAINT_DEFAULTS.opacity;

    if (entity.type === 'marker') {
      const circleOpacity = Math.min(1, Math.max(0, entityTransparency));
      return {
        'circle-radius': ENTITY_PAINT_DEFAULTS.marker.radius,
        'circle-color': entityColor,
        'circle-stroke-color': style.strokeColor || ENTITY_PAINT_DEFAULTS.strokeColor,
        'circle-stroke-width': style.strokeWidth || ENTITY_PAINT_DEFAULTS.strokeWidth,
        'circle-opacity': circleOpacity,
      };
    }

    if (entity.type === 'target') {
      return {
        'circle-radius': ENTITY_PAINT_DEFAULTS.target.radius,
        'circle-color': ENTITY_PAINT_DEFAULTS.target.color,
        'circle-stroke-color': ENTITY_PAINT_DEFAULTS.target.strokeColor,
        'circle-stroke-width': ENTITY_PAINT_DEFAULTS.target.strokeWidth,
      };
    }

    if (entity.type === 'line') {
      const lineOpacity = Math.min(1, Math.max(0, entityTransparency));
      return {
        'line-color': entityColor,
        'line-width': style.strokeWidth || entity.width || ENTITY_PAINT_DEFAULTS.strokeWidth,
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
        'fill-outline-color': style.strokeColor || ENTITY_PAINT_DEFAULTS.strokeColor,
      };
    }

    return {};
  } catch (error) {
    console.error('Error in getPaintProperties:', error, entity);
    return {
      'fill-color': ENTITY_PAINT_DEFAULTS.color,
      'fill-opacity': ENTITY_PAINT_DEFAULTS.opacity,
      'fill-outline-color': ENTITY_PAINT_DEFAULTS.strokeColor,
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
    'icon-size': ENTITY_PAINT_DEFAULTS.iconMarker.sizeScale,
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
