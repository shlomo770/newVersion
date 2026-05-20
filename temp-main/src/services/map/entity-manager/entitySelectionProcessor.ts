import type { Map as MaplibreMap } from 'maplibre-gl';
import type { TacticalEntity } from '@domain/models/entity';
import type { EntityCrudSync } from './entityCrudSync';
import type { MapLayerEntity } from './entityManagerTypes';

export class EntitySelectionProcessor {
  private readonly map: MaplibreMap;
  private readonly crud: EntityCrudSync;

  constructor(map: MaplibreMap, crud: EntityCrudSync) {
    this.map = map;
    this.crud = crud;
  }

  getCachedEntity(entityId: string): MapLayerEntity | undefined {
    return this.crud.getCachedEntity(entityId);
  }

  focusOnEntity(entity: TacticalEntity): void {
    if (!this.map) {
      console.warn('⚠️ Map is not initialized, cannot focus on entity:', entity.id);
      return;
    }

    if (!entity.coordinates || !Array.isArray(entity.coordinates) || entity.coordinates.length === 0) {
      console.error('❌ Invalid entity coordinates in focusOnEntity:', entity);
      return;
    }

    let lngSum = 0;
    let latSum = 0;

    for (let i = 0; i < entity.coordinates.length; i++) {
      const coord = entity.coordinates[i];
      if (coord && typeof coord.lng === 'number' && typeof coord.lat === 'number') {
        lngSum += coord.lng;
        latSum += coord.lat;
      } else {
        console.error('❌ Invalid coordinate at index', i, ':', coord);
        return;
      }
    }

    const coordinateCount = entity.coordinates.length;
    const centerLng = lngSum / coordinateCount;
    const centerLat = latSum / coordinateCount;

    this.map.flyTo({
      center: [centerLng, centerLat],
      zoom: 14,
      duration: 1000,
    });
  }
}
