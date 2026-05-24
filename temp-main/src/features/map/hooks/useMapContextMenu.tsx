import {
  useCallback,
  useEffect,
  useState,
  type MutableRefObject,
} from 'react';
import type { Map as MaplibreMap, MapMouseEvent, MapTouchEvent } from 'maplibre-gl';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { MapContextMenu } from '../components/MapContextMenu';
import { MapTargetSelectionMenu } from '../components/MapTargetSelectionMenu';
import { updateTarget } from '@features/targets/store/targetsSlice';
import { setActiveEditEntityId } from '@features/entities/store/entitiesSlice';
import { confirmAndDeleteEntity } from '@features/entities/lib/entityDelete';
import { TargetStateString } from '@domain/enums/target.enum';
import { ENTITY_LAYER_PREFIXES } from '@features/map/config';
import { isTabooZoneEntity } from '@features/entities/lib/entityGuards';
import { useMapCommandsOptional } from '@features/map';
import type { MapService } from '@/services/map/MapService';
import {
  TARGET_LAYER_IDS,
  buildEntityLayerIds,
  resolveTargetEntries,
  safePreventDefault,
  type ContextMenuState,
  type TargetSelectionState,
} from './mapContextMenuUtils';
import {
  MAP_CONTEXT_MENU_LONG_PRESS_MS,
  MAP_TOUCH_LONG_PRESS_CANCEL_PX,
} from '@features/map/config';

export interface MapContextMenuActions {
  onAllocateTarget: (targetId: string) => void;
  onSetTargetIdentity: (targetId: string, identity: boolean) => void;
  mapServiceRef?: MutableRefObject<MapService | null>;
  /** Fired on every map click (after target hit-testing). */
  onMapClick?: () => void;
}

/**
 * Registers map right-click / long-press handlers and renders tactical context menus.
 */
export function useMapContextMenu(
  map: MaplibreMap | null,
  actions: MapContextMenuActions,
) {
  const dispatch = useAppDispatch();
  const { onAllocateTarget, onSetTargetIdentity, mapServiceRef, onMapClick } = actions;
  const entitiesById = useAppSelector((state) => state.entities.byId);
  const activeEditEntityId = useAppSelector((state) => state.entities.activeEditEntityId);
  const selectedEntityId = useAppSelector((state) => state.entities.selectedId);
  const targetsState = useAppSelector(
    (state) => state.targets,
    (left, right) => left.byId === right.byId && left.allIds.length === right.allIds.length,
  );
  const drawingMode = useAppSelector((state) => state.mapInteraction.drawingMode);
  const mapCommands = useMapCommandsOptional();

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [targetSelectionMenu, setTargetSelectionMenu] = useState<TargetSelectionState | null>(
    null,
  );

  const closeMenus = useCallback(() => {
    setContextMenu(null);
    setTargetSelectionMenu(null);
  }, []);

  useEffect(() => {
    if (!map) return undefined;

    const entityLayerIds = buildEntityLayerIds(Object.keys(entitiesById));

    const openTargetContext = (
      entries: ReturnType<typeof resolveTargetEntries>,
      clientX: number,
      clientY: number,
    ) => {
      if (entries.length > 1) {
        setTargetSelectionMenu({ targets: entries, x: clientX, y: clientY });
        return;
      }
      if (entries.length === 1) {
        setContextMenu({
          entityId: entries[0].id,
          x: clientX,
          y: clientY,
          isTarget: true,
        });
      }
    };

    const openContextMenuAtPoint = (point: { x: number; y: number }, clientX: number, clientY: number) => {
      const availableEntityLayers = entityLayerIds.filter((layerId) => map.getLayer(layerId));
      const availableTargetLayers = TARGET_LAYER_IDS.filter((layerId) => map.getLayer(layerId));
      const availableLayers = [...availableEntityLayers, ...availableTargetLayers];

      if (availableLayers.length === 0) {
        setContextMenu(null);
        return;
      }

      const features = map.queryRenderedFeatures([point.x, point.y], { layers: availableLayers });
      if (features.length === 0) {
        setContextMenu(null);
        return;
      }

      const layerId = features[0].layer?.id ?? '';
      if (layerId.startsWith(ENTITY_LAYER_PREFIXES.layer)) {
        const entityId = layerId.slice(ENTITY_LAYER_PREFIXES.layer.length);
        const entity = entitiesById[entityId];
        if (entity) {
          setContextMenu({
            entityId,
            x: clientX,
            y: clientY,
            isTarget: false,
          });
        }
        return;
      }

      if ((TARGET_LAYER_IDS as readonly string[]).includes(layerId)) {
        const targetFeatures = features.filter(
          (f) =>
            (TARGET_LAYER_IDS as readonly string[]).includes(f.layer?.id ?? '') &&
            f.properties?.id,
        );
        const uniqueIds = targetFeatures
          .map((f) => String(f.properties?.id ?? ''))
          .filter((id, index, arr) => id && arr.indexOf(id) === index);

        const entries = resolveTargetEntries(uniqueIds, targetsState.byId);
        if (entries.length > 0) {
          openTargetContext(entries, clientX, clientY);
        }
      }
    };

    const handleContextMenu = (e: MapMouseEvent) => {
      openContextMenuAtPoint(e.point, e.originalEvent.clientX, e.originalEvent.clientY);
      safePreventDefault(e);
    };

    const handleMapClick = (e: MapMouseEvent) => {
      onMapClick?.();

      const availableTargetLayers = TARGET_LAYER_IDS.filter((layerId) => map.getLayer(layerId));
      if (availableTargetLayers.length === 0) {
        closeMenus();
        return;
      }

      const features = map.queryRenderedFeatures(e.point, { layers: availableTargetLayers });
      if (features.length === 0) {
        closeMenus();
        return;
      }

      const uniqueIds = features
        .map((f) => String(f.properties?.id ?? ''))
        .filter((id, index, arr) => id && arr.indexOf(id) === index);

      const entries = resolveTargetEntries(uniqueIds, targetsState.byId);
      if (entries.length > 1) {
        setTargetSelectionMenu({
          targets: entries,
          x: e.originalEvent.clientX,
          y: e.originalEvent.clientY,
        });
        return;
      }
      if (entries.length === 1) {
        setContextMenu({
          entityId: entries[0].id,
          x: e.originalEvent.clientX,
          y: e.originalEvent.clientY,
          isTarget: true,
        });
        return;
      }
      closeMenus();
    };

    map.on('contextmenu', handleContextMenu);
    map.on('click', handleMapClick);

    let touchTimeout: number | null = null;
    let touchStartPoint: { x: number; y: number } | null = null;

    const handleTouchStart = (e: MapTouchEvent) => {
      touchStartPoint = { x: e.point.x, y: e.point.y };
      touchTimeout = window.setTimeout(() => {
        const touch = e.originalEvent.touches[0] ?? e.originalEvent.changedTouches[0];
        openContextMenuAtPoint(
          e.point,
          touch?.clientX ?? e.point.x,
          touch?.clientY ?? e.point.y,
        );
      }, MAP_CONTEXT_MENU_LONG_PRESS_MS);
    };

    const handleTouchEnd = () => {
      if (touchTimeout) {
        clearTimeout(touchTimeout);
        touchTimeout = null;
      }
      touchStartPoint = null;
    };

    const handleTouchMove = (e: MapTouchEvent) => {
      if (!touchStartPoint) return;
      const distance = Math.hypot(e.point.x - touchStartPoint.x, e.point.y - touchStartPoint.y);
      if (distance > MAP_TOUCH_LONG_PRESS_CANCEL_PX) handleTouchEnd();
    };

    if (!drawingMode) {
      map.on('touchstart', handleTouchStart);
      map.on('touchend', handleTouchEnd);
      map.on('touchmove', handleTouchMove);
    }

    return () => {
      map.off('contextmenu', handleContextMenu);
      map.off('click', handleMapClick);
      if (!drawingMode) {
        map.off('touchstart', handleTouchStart);
        map.off('touchend', handleTouchEnd);
        map.off('touchmove', handleTouchMove);
      }
    };
  }, [map, entitiesById, targetsState.byId, drawingMode, closeMenus, onMapClick]);

  const handleDeleteEntity = useCallback(async () => {
    if (!contextMenu?.entityId || contextMenu.isTarget) return;
    const storeEntity = entitiesById[contextMenu.entityId];
    if (!storeEntity || isTabooZoneEntity(storeEntity)) {
      setContextMenu(null);
      return;
    }
    await confirmAndDeleteEntity({
      entity: storeEntity,
      editingEntityId: activeEditEntityId,
      dispatch,
      mapCommands,
      selectedEntityId,
      onEditClosed: () => dispatch(setActiveEditEntityId(null)),
    });
    setContextMenu(null);
  }, [
    contextMenu,
    entitiesById,
    activeEditEntityId,
    dispatch,
    mapCommands,
    selectedEntityId,
  ]);

  const handleEditEntity = useCallback(() => {
    if (!contextMenu?.entityId) return;
    const storeEntity = entitiesById[contextMenu.entityId];
    if (storeEntity && isTabooZoneEntity(storeEntity)) {
      setContextMenu(null);
      return;
    }
    if (storeEntity) {
      if (mapCommands) {
        mapCommands.setEditMode(contextMenu.entityId, storeEntity);
      } else {
        mapServiceRef?.current?.setEditMode(contextMenu.entityId, storeEntity);
      }
    }
    setContextMenu(null);
  }, [mapCommands, mapServiceRef, contextMenu, entitiesById]);

  const handleDesignateTarget = useCallback(() => {
    if (!contextMenu?.entityId) return;
    const target = targetsState.byId[contextMenu.entityId];
    if (target) {
      dispatch(
        updateTarget({
          ...target,
          isAssigned: true,
          status: TargetStateString.designated,
        }),
      );
    }
    setContextMenu(null);
  }, [contextMenu, dispatch, targetsState.byId]);

  const handleToggleFriend = useCallback(() => {
    if (!contextMenu?.entityId) return;
    const target = targetsState.byId[contextMenu.entityId];
    if (target) {
      onSetTargetIdentity(target.id, !target.friend);
    }
    setContextMenu(null);
  }, [onSetTargetIdentity, contextMenu, targetsState.byId]);

  const handleAllocateTarget = useCallback(() => {
    if (contextMenu?.entityId) {
      onAllocateTarget(contextMenu.entityId);
    }
    setContextMenu(null);
  }, [onAllocateTarget, contextMenu]);

  const contextMenuHost = (
    <>
      <MapContextMenu
        open={contextMenu !== null}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        onClose={() => setContextMenu(null)}
        entityId={contextMenu?.entityId ?? ''}
        entityName={
          contextMenu?.entityId
            ? String(
                entitiesById[contextMenu.entityId]?.name ??
                  targetsState.byId[contextMenu.entityId]?.type ??
                  `Target ${contextMenu.entityId}`,
              )
            : ''
        }
        isTarget={contextMenu?.isTarget ?? false}
        targetIsFriend={Boolean(
          contextMenu?.isTarget &&
            contextMenu.entityId &&
            targetsState.byId[contextMenu.entityId]?.friend,
        )}
        onEdit={handleEditEntity}
        onDelete={handleDeleteEntity}
        onAllocateTarget={handleAllocateTarget}
        onDesignateTarget={handleDesignateTarget}
        onToggleFriend={handleToggleFriend}
      />

      <MapTargetSelectionMenu
        open={targetSelectionMenu !== null}
        x={targetSelectionMenu?.x ?? 0}
        y={targetSelectionMenu?.y ?? 0}
        targets={targetSelectionMenu?.targets ?? []}
        onClose={() => setTargetSelectionMenu(null)}
        onSelectTarget={(targetId) => {
          setTargetSelectionMenu(null);
          setContextMenu({
            entityId: targetId,
            x: targetSelectionMenu?.x ?? 0,
            y: targetSelectionMenu?.y ?? 0,
            isTarget: true,
          });
        }}
      />
    </>
  );

  return {
    contextMenuHost,
    closeMenus,
    contextMenu,
    targetSelectionMenu,
  };
}
