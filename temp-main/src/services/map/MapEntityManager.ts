import type { Map as MaplibreMap } from 'maplibre-gl';
import type { TacticalEntity } from '@domain/models/entity';
import { EntityCrudSync } from './entity-manager/entityCrudSync';
import { EntitySelectionProcessor } from './entity-manager/entitySelectionProcessor';
import type { MapLayerEntity } from './entity-manager/entityManagerTypes';

/**
 * Facade orchestrating entity map layers via focused sub-services.
 * @see entity-manager/entityCrudSync — layer/source sync
 * @see entity-manager/entitySelectionProcessor — focus & cache reads
 * @see entity-manager/entityEventHandlers — labels & diagnostics
 */
export class MapEntityManager {
  private readonly crud: EntityCrudSync;
  private readonly selection: EntitySelectionProcessor;

  constructor(map: MaplibreMap) {
    this.crud = new EntityCrudSync(map);
    this.selection = new EntitySelectionProcessor(map, this.crud);
  }

  public addEntityToMap(entity: MapLayerEntity): void {
    this.crud.addEntityToMap(entity);
  }

  public removeEntityFromMap(entityId: string): void {
    this.crud.removeEntityFromMap(entityId);
  }

  public updateEntityOnMap(entity: MapLayerEntity): void {
    this.crud.updateEntityOnMap(entity);
  }

  public focusOnEntity(entity: TacticalEntity): void {
    this.selection.focusOnEntity(entity);
  }

  public getCachedEntity(entityId: string): MapLayerEntity | undefined {
    return this.selection.getCachedEntity(entityId);
  }
}
