import { store } from '@app/store';
import { selectDisplayedEntitiesOnMap } from '@features/entities';
import type { MapServiceRuntime } from '@/services/map/mapServiceRuntime';

/** Bridges Redux entity state into map services without inverting layer dependencies. */
export function createMapServiceRuntime(): MapServiceRuntime {
  return {
    getAllEntities: () => Object.values(store.getState().entities.byId),
    getEntitiesForMap: () => selectDisplayedEntitiesOnMap(store.getState()),
    getEntitiesById: () => store.getState().entities.byId,
    getSelectedMarkerIcon: () => store.getState().entities.selectedMarkerIcon || 'E7BA',
  };
}
