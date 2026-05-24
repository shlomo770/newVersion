import type { Map as MaplibreMap } from 'maplibre-gl';
import {
  entityIconLayerId,
  entityLabelLayerId,
  entityLabelSourceId,
  entityLayerId,
  entitySourceId,
} from './entityIds';
import {
  convertEntityToGeoJSON,
  getLayerTypeForEntity,
  resolveEntityGeoJson,
} from './entityGeoJsonBuilder';
import {
  buildIconMarkerFeature,
  ensureMarkerIconImage,
  getIconMarkerLayout,
  getPaintProperties,
  isIconMarkerEntity,
  type EntityLayerPaint,
} from './entityLayerStyle';
import { addEntityLabelLayer, syncEntityLabelLayer } from './entityEventHandlers';
import type { EntityGeoJsonFeature, MapLayerEntity } from './entityManagerTypes';
import { resolveEntityTransparency } from './entityManagerTypes';
import type { EntityType } from '@domain/models/entity';
import { hasTransparency } from '@domain/models/entity';

function buildEntityLayerObject(
  layerId: string,
  entityType: EntityType,
  sourceId: string,
  paint: EntityLayerPaint,
): maplibregl.AddLayerObject {
  const layerType = getLayerTypeForEntity(entityType);
  if (layerType === 'fill') {
    return { id: layerId, type: 'fill', source: sourceId, paint };
  }
  if (layerType === 'line') {
    return { id: layerId, type: 'line', source: sourceId, paint };
  }
  return { id: layerId, type: 'circle', source: sourceId, paint };
}

export class EntityCrudSync {
  private readonly map: MaplibreMap;
  private readonly entityCache = new Map<string, MapLayerEntity>();
  private readonly addedIconImages = new Set<string>();
  private readonly pendingAddTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly pendingRemoveTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly addRetryCounts = new Map<string, number>();
  private readonly removeRetryCounts = new Map<string, number>();
  private readonly entityLocks = new Set<string>();
  private readonly MAX_RETRIES = 50;

  constructor(map: MaplibreMap) {
    this.map = map;
  }

  getCachedEntity(entityId: string): MapLayerEntity | undefined {
    return this.entityCache.get(entityId);
  }

  getEntityCache(): ReadonlyMap<string, MapLayerEntity> {
    return this.entityCache;
  }

  addEntityToMap(entity: MapLayerEntity): void {
    if (!entity.id) return;

    const map = this.map;
    const entityId = String(entity.id);
    const sourceId = entitySourceId(entity.id);
    const layerId = entityLayerId(entity.id);

    const pendingTimer = this.pendingAddTimers.get(entityId);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      this.pendingAddTimers.delete(entityId);
    }
    const retryCount = this.addRetryCounts.get(entityId) ?? 0;

    if (this.entityLocks.has(entity.id)) return;
    this.entityLocks.add(entity.id);

    if (!map.isStyleLoaded()) {
      if (retryCount >= this.MAX_RETRIES) {
        this.entityLocks.delete(entity.id);
        this.addRetryCounts.delete(entityId);
        return;
      }

      const timer = setTimeout(() => {
        this.pendingAddTimers.delete(entityId);
        this.entityLocks.delete(entity.id);
        this.addRetryCounts.set(entityId, retryCount + 1);
        this.addEntityToMap(entity);
      }, 50);
      this.pendingAddTimers.set(entityId, timer);
      return;
    }

    if (!entity.geometry && (!entity.coordinates || !Array.isArray(entity.coordinates))) {
      console.error('❌ Invalid entity (missing geometry/coords):', entity);
      this.entityLocks.delete(entity.id);
      this.addRetryCounts.delete(entityId);
      return;
    }

    const geojson: EntityGeoJsonFeature = resolveEntityGeoJson(entity);
    const existingSource = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;

    if (!existingSource) {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);

        if (isIconMarkerEntity(entity)) {
          const iconFeature = buildIconMarkerFeature(entity);
          if (iconFeature) {
            const code = entity.properties.iconChar;
            const iconLayerId = entityIconLayerId(entity.id);
            ensureMarkerIconImage(map, code, this.addedIconImages);
            map.addSource(sourceId, {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: iconFeature.geometry,
                properties: iconFeature.properties,
              },
            });
            map.addLayer({
              id: iconLayerId,
              type: 'symbol',
              source: sourceId,
              layout: getIconMarkerLayout(),
            });
          }
        } else {
          map.addSource(sourceId, { type: 'geojson', data: geojson });
          map.addLayer(buildEntityLayerObject(layerId, entity.type, sourceId, getPaintProperties(entity)));
          addEntityLabelLayer(map, entity);
        }

        map.triggerRepaint();
        this.entityCache.set(entity.id, { ...entity });
      } catch (err) {
        console.error('❌ Error creating entity:', err);
      }

      this.entityLocks.delete(entity.id);
      this.addRetryCounts.delete(entityId);
      return;
    }

    try {
      existingSource.setData(geojson);

      if (isIconMarkerEntity(entity)) {
        const iconFeature = buildIconMarkerFeature(entity);
        if (iconFeature) {
          const code = entity.properties.iconChar;
          ensureMarkerIconImage(map, code, this.addedIconImages);
          existingSource.setData({
            type: 'Feature',
            geometry: iconFeature.geometry,
            properties: iconFeature.properties,
          });
        }
      } else {
        const paint = getPaintProperties(entity);
        for (const [key, val] of Object.entries(paint)) {
          try {
            map.setPaintProperty(layerId, key, val);
          } catch {
            /* layer may not exist yet during style churn */
          }
        }
        addEntityLabelLayer(map, entity);
      }

      map.triggerRepaint();
      this.entityCache.set(entity.id, { ...entity });
    } catch (err) {
      console.error('⚠ Update failed, recreating:', err);
      this.recreateEntityLayer(map, entity, geojson, sourceId, layerId);
    }

    requestAnimationFrame(() => {
      this.entityLocks.delete(entity.id);
      this.addRetryCounts.delete(entityId);
    });
  }

  private recreateEntityLayer(
    map: MaplibreMap,
    entity: MapLayerEntity,
    geojson: EntityGeoJsonFeature,
    sourceId: string,
    layerId: string,
  ): void {
    try {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      const iconLayerId = entityIconLayerId(entity.id);
      if (map.getLayer(iconLayerId)) map.removeLayer(iconLayerId);

      if (isIconMarkerEntity(entity)) {
        const iconFeature = buildIconMarkerFeature(entity);
        if (iconFeature) {
          const code = entity.properties.iconChar;
          ensureMarkerIconImage(map, code, this.addedIconImages);
          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: iconFeature.geometry,
              properties: iconFeature.properties,
            },
          });
          map.addLayer({
            id: iconLayerId,
            type: 'symbol',
            source: sourceId,
            layout: getIconMarkerLayout(),
          });
        }
      } else {
        map.addSource(sourceId, { type: 'geojson', data: geojson });
        map.addLayer(buildEntityLayerObject(layerId, entity.type, sourceId, getPaintProperties(entity)));
        addEntityLabelLayer(map, entity);
      }
    } catch (inner) {
      console.error('❌ Recreate failed:', inner);
    }
  }

  removeEntityFromMap(entityId: string): void {
    const pendingRemove = this.pendingRemoveTimers.get(entityId);
    if (pendingRemove) {
      clearTimeout(pendingRemove);
      this.pendingRemoveTimers.delete(entityId);
    }
    const pendingTimer = this.pendingAddTimers.get(entityId);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      this.pendingAddTimers.delete(entityId);
    }
    const removeRetryCount = this.removeRetryCounts.get(entityId) ?? 0;

    if (!this.map.isStyleLoaded()) {
      if (removeRetryCount >= this.MAX_RETRIES) {
        this.pendingRemoveTimers.delete(entityId);
        this.removeRetryCounts.delete(entityId);
        return;
      }
      const retryTimer = setTimeout(() => {
        this.pendingRemoveTimers.delete(entityId);
        this.removeRetryCounts.set(entityId, removeRetryCount + 1);
        this.removeEntityFromMap(entityId);
      }, 80);
      this.pendingRemoveTimers.set(entityId, retryTimer);
      return;
    }

    const sourceId = entitySourceId(entityId);
    const layerId = entityLayerId(entityId);

    try {
      const iconLayerId = entityIconLayerId(entityId);
      if (this.map.getLayer(iconLayerId)) {
        this.map.removeLayer(iconLayerId);
      }
      if (this.map.getLayer(entityLabelLayerId(entityId))) {
        this.map.removeLayer(entityLabelLayerId(entityId));
      }
      if (this.map.getSource(entityLabelSourceId(entityId))) {
        this.map.removeSource(entityLabelSourceId(entityId));
      }
      if (this.map.getLayer(layerId)) {
        this.map.removeLayer(layerId);
      }
      if (this.map.getSource(sourceId)) {
        this.map.removeSource(sourceId);
      }

      this.entityCache.delete(entityId);
      this.removeRetryCounts.delete(entityId);
      this.addRetryCounts.delete(entityId);
    } catch (error) {
      console.error('❌ Error removing entity from map:', error, entityId);
    }
  }

  updateEntityOnMap(entity: MapLayerEntity): void {
    if (!entity.id) {
      console.warn('⚠️ Invalid entity in updateEntityOnMap:', entity);
      return;
    }

    const map = this.map;
    const sourceId = entitySourceId(entity.id);
    const layerId = entityLayerId(entity.id);
    const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;

    if (!source) {
      console.warn('⚠️ UPDATE: source does not exist:', sourceId);
      return;
    }

    if (entity.type !== 'sector') {
      let geojson: EntityGeoJsonFeature;
      if (entity.geometry && typeof entity.geometry === 'object' && 'type' in entity.geometry) {
        geojson = {
          type: 'Feature',
          geometry: entity.geometry as EntityGeoJsonFeature['geometry'],
          properties: {
            ...(entity.properties || {}),
            id: entity.id,
            type: entity.type,
            name: entity.name,
            category: String(entity.category),
            color: entity.color,
            transparency: resolveEntityTransparency(entity),
          },
        };
      } else if (entity.coordinates) {
        geojson = convertEntityToGeoJSON(entity);
      } else {
        console.error('❌ Entity has no geometry or coordinates in updateEntityOnMap:', entity);
        return;
      }

      try {
        source.setData(geojson);
      } catch (err) {
        console.error('❌ Failed to setData on source in updateEntityOnMap:', err);
      }
    }

    switch (entity.type) {
      case 'marker':
      case 'target': {
        if (isIconMarkerEntity(entity)) {
          const iconFeature = buildIconMarkerFeature(entity);
          if (iconFeature) {
            const code = entity.properties.iconChar;
            ensureMarkerIconImage(map, code, this.addedIconImages);
            source.setData({
              type: 'Feature',
              geometry: iconFeature.geometry,
              properties: iconFeature.properties,
            });
          }
        } else if (map.getLayer(layerId)) {
          if (entity.color !== undefined) {
            map.setPaintProperty(layerId, 'circle-color', entity.color);
          }
          const transparency = resolveEntityTransparency(entity);
          if (transparency !== undefined) {
            map.setPaintProperty(layerId, 'circle-opacity', transparency);
          }
          if (entity.style?.strokeColor !== undefined) {
            map.setPaintProperty(layerId, 'circle-stroke-color', entity.style.strokeColor);
          }
          if (entity.style?.strokeWidth !== undefined) {
            map.setPaintProperty(layerId, 'circle-stroke-width', entity.style.strokeWidth);
          }
        }
        break;
      }

      case 'line': {
        if (entity.color !== undefined) {
          map.setPaintProperty(layerId, 'line-color', entity.color);
        }
        if (entity.width !== undefined) {
          map.setPaintProperty(layerId, 'line-width', entity.width);
        } else if (entity.style?.strokeWidth !== undefined) {
          map.setPaintProperty(layerId, 'line-width', entity.style.strokeWidth);
        }
        if (hasTransparency(entity) && entity.transparency !== undefined) {
          map.setPaintProperty(layerId, 'line-opacity', entity.transparency);
        }
        syncEntityLabelLayer(map, entity);
        break;
      }

      case 'polygon':
      case 'rectangle':
      case 'circle':
      case 'ellipse':
      case 'sector': {
        if (entity.color !== undefined) {
          map.setPaintProperty(layerId, 'fill-color', entity.color);
        }
        if (hasTransparency(entity) && entity.transparency !== undefined) {
          map.setPaintProperty(layerId, 'fill-opacity', entity.transparency);
        }
        if (entity.style?.strokeColor !== undefined) {
          map.setPaintProperty(layerId, 'fill-outline-color', entity.style.strokeColor);
        }
        syncEntityLabelLayer(map, entity);
        break;
      }

      default:
        break;
    }

    map.triggerRepaint();
    this.entityCache.set(entity.id, { ...entity });
  }
}
