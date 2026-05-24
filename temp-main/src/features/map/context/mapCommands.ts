import type { MutableRefObject } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { TacticalEntity } from '@domain/models/entity';
import type { MapService } from '@/services/map/MapService';
import { MAP_PAN_TO_DURATION_MS } from '@features/map/config';

/** Narrow map API for UI — avoids prop-drilling the full MapService ref. */
export interface MapCommands {
  getMap(): MaplibreMap | null;
  panTo(lng: number, lat: number, options?: { duration?: number }): void;
  removeEntityFromMap(entityId: string): void;
  setEditMode(entityId: string, entity: TacticalEntity): void;
  focusOnEntity(entity: TacticalEntity): void;
}

export function createMapCommands(
  mapServiceRef: MutableRefObject<MapService | null>,
): MapCommands {
  return {
    getMap: () => mapServiceRef.current?.getMap() ?? null,
    panTo: (lng, lat, options) => {
      mapServiceRef.current
        ?.getMap()
        ?.panTo([lng, lat], { duration: options?.duration ?? MAP_PAN_TO_DURATION_MS });
    },
    removeEntityFromMap: (entityId) => {
      mapServiceRef.current?.removeEntityFromMap(entityId);
    },
    setEditMode: (entityId, entity) => {
      mapServiceRef.current?.setEditMode(entityId, entity);
    },
    focusOnEntity: (entity) => {
      mapServiceRef.current?.focusOnEntity(entity);
    },
  };
}
