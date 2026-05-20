import { useCallback, useLayoutEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { updateEntity } from '@features/entities';
import type { TacticalEntity } from '@domain/models/entity';
import type { Coordinates } from '@domain/models/coordinates';
import { buildGeometryForUpdate } from '@/services/entities/EntityGeometryService';
import { sendUpdateEntity } from '@features/entities';
import type { MapFacade } from '../services/MapFacade';

type UseMapEntitiesParams = {
  mapFacadeRef: MutableRefObject<MapFacade | null>;
  entitiesById: Record<string, TacticalEntity>;
};

export function useMapEntities({ mapFacadeRef, entitiesById }: UseMapEntitiesParams) {
  const dispatch = useAppDispatch();
  const prevEntityIds = useRef<Set<string>>(new Set());
  const prevEntitiesById = useRef<Record<string, TacticalEntity>>({});

  useLayoutEffect(() => {
    const facade = mapFacadeRef.current;
    if (!facade) return;
    const map = facade.getMap();
    if (!map) return;

    const currentIds = new Set(Object.keys(entitiesById));
    const removedIds = Array.from(prevEntityIds.current).filter((id) => !currentIds.has(id));
    removedIds.forEach((id) => {
      facade.removeEntityFromMap(id);
    });

    const styleLayers = map.getStyle()?.layers ?? [];
    for (const layer of styleLayers) {
      const layerId = layer.id;
      const iconPrefix = 'entity-icon-layer-';
      const fillPrefix = 'entity-layer-';
      const labelPrefix = 'entity-label-layer-';
      let entityId: string | null = null;
      if (layerId.startsWith(iconPrefix)) entityId = layerId.slice(iconPrefix.length);
      else if (layerId.startsWith(fillPrefix)) entityId = layerId.slice(fillPrefix.length);
      else if (layerId.startsWith(labelPrefix)) entityId = layerId.slice(labelPrefix.length);
      if (entityId && !currentIds.has(entityId)) {
        facade.removeEntityFromMap(entityId);
      }
    }

    const styleSources = map.getStyle()?.sources ?? {};
    for (const sourceId of Object.keys(styleSources)) {
      if (!sourceId.startsWith('entity-')) continue;
      if (sourceId.startsWith('entity-label-')) continue;
      const entityId = sourceId.slice('entity-'.length);
      if (!entityId || currentIds.has(entityId)) continue;
      facade.removeEntityFromMap(entityId);
    }

    Object.entries(entitiesById).forEach(([id, entity]) => {
      if (!prevEntityIds.current.has(id)) {
        facade.addEntityToMap(entity);
      } else if (prevEntitiesById.current[id] !== entity) {
        facade.updateEntityToMap(entity);
      }
    });

    prevEntityIds.current = currentIds;
    prevEntitiesById.current = { ...entitiesById };
  }, [entitiesById, mapFacadeRef]);

  const handleEntityUpdated = useCallback(
    (id: string, coordinates: Coordinates[]) => {
      const entity = entitiesById[id];
      if (!entity) return;
      const geometry = buildGeometryForUpdate(entity, coordinates);
      dispatch(
        updateEntity({
          id,
          coordinates,
          geometry,
          updatedAt: Date.now(),
        }),
      );
      sendUpdateEntity(entity.id, entity.category, entity.type, coordinates, entity.name);
    },
    [dispatch, entitiesById],
  );

  const handleEntityDeleted = useCallback(() => {}, []);

  return { handleEntityUpdated, handleEntityDeleted };
}
