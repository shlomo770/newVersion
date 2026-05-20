import type { Map as MaplibreMap } from 'maplibre-gl';
import type { TacticalEntity } from '@domain/models/entity';
import { store } from '@app/store';
import { MapEntityManager } from './MapEntityManager';
import { selectDisplayedEntitiesOnMap } from '@features/entities';
import type { MapLayerEntity } from './entity-manager/entityManagerTypes';

export class MapEntityRenderer {
  private map: MaplibreMap;
  private entityManager: MapEntityManager;

  constructor(map: MaplibreMap) {
    this.map = map;
    this.entityManager = new MapEntityManager(map);
  }

  public addEntityToMap(entity: TacticalEntity) {
    this.entityManager.addEntityToMap(entity);
  }

  public updateEntityToMap(entity: TacticalEntity) {
    this.entityManager.updateEntityOnMap(entity);
  }

  public removeEntityFromMap(entityId: string) {
    this.entityManager.removeEntityFromMap(entityId);
  }

  public focusOnEntity(entity: TacticalEntity) {
    this.entityManager.focusOnEntity(entity);
  }

  public getCachedEntity(entityId: string): MapLayerEntity | undefined {
    return this.entityManager.getCachedEntity(entityId);
  }

  public clearAllEntitiesFromMap() {
    if (!this.map) return;
    const map = this.map;

    map.getStyle().layers?.forEach((layer) => {
      if (layer.id.startsWith("entity-")) {
        if (map.getLayer(layer.id)) map.removeLayer(layer.id);
      }
    });

    Object.keys(map.getStyle().sources).forEach((srcId) => {
      if (srcId.startsWith("entity-")) {
        if (map.getSource(srcId)) map.removeSource(srcId);
      }
    });
  }

  public reloadAllEntities() {
    if (!this.map) return;
    this.clearAllEntitiesFromMap();
    const entitiesForMap = selectDisplayedEntitiesOnMap(store.getState());
    Object.values(entitiesForMap).forEach((e) => {
      if (e) this.addEntityToMap(e);
    });
  }
}
