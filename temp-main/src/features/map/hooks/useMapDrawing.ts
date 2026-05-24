import { useCallback, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import {
  addEntity,
  setCreationForm,
} from '@features/entities';
import { setDrawingMode } from '@features/map';
import type { EntityDrawDraft, EntityType } from '@domain/models/entity';
import type { Coordinates } from '@domain/models/coordinates';
import { EntityCategoryEnum } from '@domain/enums/entity.enum';
import {
  buildNewEntity,
  closePolygonCoordinates,
} from '@/services/entities/EntityGeometryService';
import { store } from '@app/store';
import { sendSaveEntity } from '@features/entities';
import type { MapFacade } from '../services/MapFacade';

type UseMapDrawingParams = {
  mapFacadeRef: MutableRefObject<MapFacade | null>;
};

function notifyServerEntityCreated(
  id: string,
  category: EntityCategoryEnum,
  type: EntityType,
  coordinates: Coordinates[],
  name: string,
): void {
  sendSaveEntity(id, category, type, coordinates, name);
}

function withCreationHeight(coords: Coordinates[], height: number): Coordinates[] {
  return coords.map((c) => ({ ...c, alt: height }));
}

export function useMapDrawing({ mapFacadeRef }: UseMapDrawingParams) {
  const dispatch = useAppDispatch();
  const lastCreateRef = useRef<{ key: string; at: number } | null>(null);

  const cleanupPreview = useCallback(
    (type: EntityType) => {
      const facade = mapFacadeRef.current;
      if (!facade) return;
      if (type === 'circle') facade.underlying.removeCirclePreview();
      if (type === 'ellipse') facade.underlying.removeEllipsePreview();
      if (type === 'sector') facade.underlying.removeSectorPreview();
      if (type === 'polygon' || type === 'line') facade.underlying.removePolygonPreview();
      if (type === 'marker') facade.underlying.removeCirclePreview?.();
    },
    [mapFacadeRef],
  );

  const handleEntityDrawn = useCallback(
    (entity: EntityDrawDraft) => {
      const iconChar =
        entity.properties && typeof entity.properties === 'object' && 'iconChar' in entity.properties
          ? String((entity.properties as { iconChar?: string }).iconChar ?? '')
          : null;
      const dedupeKey = JSON.stringify({
        type: entity.type,
        coordinates: entity.coordinates ?? [],
        iconChar,
      });
      const now = Date.now();
      if (
        lastCreateRef.current &&
        lastCreateRef.current.key === dedupeKey &&
        now - lastCreateRef.current.at < 400
      ) {
        return;
      }
      lastCreateRef.current = { key: dedupeKey, at: now };

      const { creationName, creationCategory, creationHeight } = store.getState().entities;
      const baseName = (creationName && creationName.trim()) || 'Entity';
      const baseCategory = creationCategory || EntityCategoryEnum.FREE;
      const height = Number.isFinite(Number(creationHeight)) ? Number(creationHeight) : 0;

      if (entity.type === 'marker') {
        const entityId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        const newEntity = buildNewEntity(
          entityId,
          baseName || 'Point',
          EntityCategoryEnum.FREE,
          'marker',
          withCreationHeight(entity.coordinates, height),
          entity.properties?.iconChar ? { iconChar: String(entity.properties.iconChar) } : undefined,
        );
        dispatch(addEntity(newEntity));
        notifyServerEntityCreated(
          newEntity.id,
          newEntity.category,
          newEntity.type,
          newEntity.coordinates,
          newEntity.name,
        );
        cleanupPreview('marker');
        dispatch(setCreationForm({ name: '', category: EntityCategoryEnum.FREE, height: 0 }));
        dispatch(setDrawingMode(null));
        return;
      }

      const name = baseName || 'Entity';
      const category = baseCategory || EntityCategoryEnum.FREE;
      const entityId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      const finalCoordinates =
        entity.type === 'polygon'
          ? closePolygonCoordinates(withCreationHeight(entity.coordinates, height))
          : withCreationHeight(entity.coordinates, height);
      const newEntity = buildNewEntity(entityId, name, category, entity.type, finalCoordinates);
      dispatch(addEntity(newEntity));
      notifyServerEntityCreated(
        newEntity.id,
        newEntity.category,
        newEntity.type,
        newEntity.coordinates,
        newEntity.name,
      );
      dispatch(setCreationForm({ name: '', category: EntityCategoryEnum.FREE, height: 0 }));
      cleanupPreview(entity.type);
      dispatch(setDrawingMode(null));
    },
    [cleanupPreview, dispatch, mapFacadeRef],
  );

  return { handleEntityDrawn };
}
