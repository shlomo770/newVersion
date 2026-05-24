import type { TacticalEntity } from '@domain/models/entity';

/**
 * Injected read-only access to entity state for map services.
 * Wired from the feature layer (MapFacade) — services must not import Redux or features.
 */
export interface MapServiceRuntime {
  getAllEntities(): TacticalEntity[];
  getEntitiesForMap(): Record<string, TacticalEntity | undefined>;
  getEntitiesById(): Record<string, TacticalEntity>;
  getSelectedMarkerIcon(): string;
}

export const emptyMapServiceRuntime: MapServiceRuntime = {
  getAllEntities: () => [],
  getEntitiesForMap: () => ({}),
  getEntitiesById: () => ({}),
  getSelectedMarkerIcon: () => 'E7BA',
};
