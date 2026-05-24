import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { store } from '@app/store';
import {
  addEntity,
  Entity,
  removeEntity,
  setSelectedEntity,
  updateEntity,
  setActiveMissionId,
  upsertMission,
  setMissionEntityRefs,
  renameMission,
} from '@features/entities/store/entitiesSlice';
import { createLocalMissionId, missionEntityIds } from '@features/entities/api/missionWire';
import {
  sendDeleteEntity,
  sendSaveEntity,
  buildSaveMissionEntitiesField,
} from '@features/entities/api/outboundBuilders';
import { useWebSocket } from '@core/api/hooks/useWebSocket';
import { WsMessageName } from '@domain/enums/ws.enum';
import { EntityCategoryEnum } from '@domain/enums/entity.enum';
import { MARKER_ICONS } from '@/constants/markerIcons';
import { pickMissionCopyName, pickNewMissionName } from '../ui/entitiesSidebar/entitiesSidebarUtils';
import { setEntityVisibilityOnMap } from '@/utils/mapEntityLayerVisibility';
import type { MinimalMap } from '@/utils/mapEntityLayerVisibility';
import { swalConfirmDanger, swalInfo } from '@/utils/swalDialog';
import { he } from '@shared/i18n';
import { useMapCommandsOptional } from '@features/map';

export function useEntitiesSidebarNavigation() {
  const missionListUiResetNonce = useAppSelector((state) => state.entities.missionListUiResetNonce);
  const [isEntityOpen, setIsEntityOpen] = useState(false);
  const [isPointsOpen, setIsPointsOpen] = useState(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState(false);
  const [openAreaCategory, setOpenAreaCategory] = useState<string | null>(null);
  const [openAreaTypeKey, setOpenAreaTypeKey] = useState<string | null>(null);
  const [openMarkerGroup, setOpenMarkerGroup] = useState<string | null>(null);
  const missionBarResetSeen = useRef(missionListUiResetNonce);

  useEffect(() => {
    if (missionListUiResetNonce === missionBarResetSeen.current) return;
    missionBarResetSeen.current = missionListUiResetNonce;
    setIsMissionsOpen(false);
  }, [missionListUiResetNonce]);

  const toggleAreas = useCallback(() => {
    setIsEntityOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsPointsOpen(false);
        setOpenAreaCategory(null);
        setOpenAreaTypeKey(null);
      }
      return next;
    });
  }, []);

  const headerTitle = isMissionsOpen
    ? he.entities.sidebar.missions
    : isPointsOpen
      ? he.entities.sidebar.points
      : isEntityOpen
        ? he.entities.sidebar.areas
        : he.entities.sidebar.root;

  return {
    isEntityOpen,
    setIsEntityOpen,
    isPointsOpen,
    setIsPointsOpen,
    isMissionsOpen,
    setIsMissionsOpen,
    openAreaCategory,
    setOpenAreaCategory,
    openAreaTypeKey,
    setOpenAreaTypeKey,
    openMarkerGroup,
    setOpenMarkerGroup,
    toggleAreas,
    headerTitle,
  };
}

export function useEntitiesSidebarGrouping(
  areaSearchQuery: string,
  pointsSearchQuery: string,
  missionSearchQuery: string,
) {
  const entities = useAppSelector((state) => state.entities);
  const missionsById = useAppSelector((state) => state.entities.missionsById);
  const selectedEntityId = useAppSelector((state) => state.entities.selectedId);
  const [entityOpen, setEntityOpen] = useState<Entity | null>(null);

  useEffect(() => {
    if (!selectedEntityId) {
      setEntityOpen(null);
      return;
    }
    const selectedEntity = entities.allIds
      .map((id) => entities.byId[id])
      .find((entity) => entity?.id === selectedEntityId);
    setEntityOpen(selectedEntity ?? null);
  }, [entities, selectedEntityId]);

  const areaEntities = useMemo(
    () =>
      entities.allIds
        .map((id) => entities.byId[id])
        .filter((e): e is Entity => Boolean(e) && e.type !== 'marker'),
    [entities.allIds, entities.byId],
  );

  const areaByCategory = useMemo(() => {
    const out: Record<string, Record<string, Entity[]>> = {};
    for (const ent of areaEntities) {
      const cat = EntityCategoryEnum[ent.category] || EntityCategoryEnum.FREE;
      const type = (ent.type || 'Other') as string;
      if (!out[cat]) out[cat] = {};
      if (!out[cat][type]) out[cat][type] = [];
      out[cat][type].push(ent);
    }
    for (const cat of Object.keys(out)) {
      for (const type of Object.keys(out[cat])) {
        out[cat][type].sort((a, b) => a.name.localeCompare(b.name));
      }
    }
    return out;
  }, [areaEntities]);

  const areaSearchLower = areaSearchQuery.trim().toLowerCase();
  const filteredAreaByCategory = useMemo(() => {
    if (!areaSearchLower) return areaByCategory;
    const out: Record<string, Record<string, Entity[]>> = {};
    for (const [cat, types] of Object.entries(areaByCategory)) {
      const filteredTypes: Record<string, Entity[]> = {};
      for (const [type, list] of Object.entries(types)) {
        const filtered = list.filter((e) => e.name.toLowerCase().includes(areaSearchLower));
        if (filtered.length > 0) filteredTypes[type] = filtered;
      }
      if (Object.keys(filteredTypes).length > 0) out[cat] = filteredTypes;
    }
    return out;
  }, [areaByCategory, areaSearchLower]);

  const pointsByIcon = useMemo(() => {
    return entities.allIds
      .map((id) => entities.byId[id])
      .filter((e): e is Entity => Boolean(e) && e.type === 'marker')
      .reduce((acc: Record<string, Entity[]>, e) => {
        const code = (e.properties && (e.properties as { iconChar?: string }).iconChar) as
          | string
          | undefined;
        const def = MARKER_ICONS.find((m) => m.code === code);
        const key = def?.label || 'Other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(e);
        return acc;
      }, {});
  }, [entities.allIds, entities.byId]);

  const pointsSearchLower = pointsSearchQuery.trim().toLowerCase();
  const filteredPointsByIcon = useMemo(() => {
    if (!pointsSearchLower) return pointsByIcon;
    const out: Record<string, Entity[]> = {};
    for (const [icon, list] of Object.entries(pointsByIcon)) {
      const filtered = list.filter((e) => e.name.toLowerCase().includes(pointsSearchLower));
      if (filtered.length > 0) out[icon] = filtered;
    }
    return out;
  }, [pointsByIcon, pointsSearchLower]);

  const sortedMissions = useMemo(
    () => Object.values(missionsById).sort((a, b) => a.name.localeCompare(b.name, 'he')),
    [missionsById],
  );

  const sortedMissionNames = useMemo(() => sortedMissions.map((m) => m.name), [sortedMissions]);

  const filteredMissions = useMemo(() => {
    const q = missionSearchQuery.trim().toLowerCase();
    if (!q) return sortedMissions;
    return sortedMissions.filter((m) => m.name.toLowerCase().includes(q));
  }, [sortedMissions, missionSearchQuery]);

  return {
    entities,
    entityOpen,
    filteredAreaByCategory,
    filteredPointsByIcon,
    sortedMissions,
    sortedMissionNames,
    filteredMissions,
  };
}

export function useEntityGroupActions(editingEntityId?: string | null) {
  const dispatch = useAppDispatch();
  const selectedEntityId = useAppSelector((state) => state.entities.selectedId);
  const mapCommands = useMapCommandsOptional();

  const setGroupVisibility = useCallback(
    (list: Entity[], visible: boolean) => {
      list.forEach((e) => dispatch(updateEntity({ id: e.id, visible })));
      const map = mapCommands?.getMap() as MinimalMap | null | undefined;
      if (map) list.forEach((e) => setEntityVisibilityOnMap(map, e.id, visible));
    },
    [dispatch, mapCommands],
  );

  const deleteGroup = useCallback(
    async (list: Entity[], label: string) => {
      if (editingEntityId && list.some((e) => e.id === editingEntityId)) {
        await swalInfo(he.entities.delete.cannotDeleteEditing, he.entities.delete.cannotDeleteTitle);
        return;
      }
      const ok = await swalConfirmDanger(
        `למחוק את <strong>${label}</strong> (${list.length} פריטים)?`,
        {
          title: he.entities.delete.deleteGroupTitle,
          confirmText: he.common.delete,
          cancelText: he.common.cancel,
          richText: true,
        },
      );
      if (!ok) return;
      list.forEach((e) => {
        sendDeleteEntity(e.id);
        dispatch(removeEntity(e.id));
        mapCommands?.removeEntityFromMap(e.id);
      });
      if (list.some((e) => e.id === selectedEntityId)) dispatch(setSelectedEntity(null));
    },
    [editingEntityId, dispatch, mapCommands, selectedEntityId],
  );

  return { setGroupVisibility, deleteGroup };
}

export function useMissionActions() {
  const dispatch = useAppDispatch();
  const activeMissionId = useAppSelector((state) => state.entities.activeMissionId);
  const { sendMessage } = useWebSocket();
  const localDraftMissionNamesRef = useRef<Set<string>>(new Set());

  const handleMissionMemberIdsChange = useCallback(
    (ids: string[]) => {
      if (!activeMissionId) return;
      const ent = store.getState().entities;
      const refs = ids
        .map((id) => {
          const entity = ent.byId[id];
          return entity ? { id, type: entity.type } : null;
        })
        .filter((r): r is { id: string; type: Entity['type'] } => Boolean(r));
      dispatch(setMissionEntityRefs({ missionId: activeMissionId, entityRefs: refs }));
    },
    [activeMissionId, dispatch],
  );

  const createLocalMission = useCallback(() => {
    const list = store.getState().entities.missionsList;
    const name = pickNewMissionName(list);
    const id = createLocalMissionId();
    dispatch(upsertMission({ id, name, entityRefs: [] }));
    localDraftMissionNamesRef.current.add(name);
  }, [dispatch]);

  const handleMissionRename = useCallback(
    async (missionId: string, newName: string): Promise<boolean> => {
      const t = newName.trim();
      if (!t) return false;
      const ent = store.getState().entities;
      const current = ent.missionsById[missionId];
      if (!current || current.name === t) return true;
      const list = ent.missionsList;
      if (list.some((x) => x !== current.name && x === t)) {
        await swalInfo(he.entities.sidebar.duplicateMissionName, he.entities.sidebar.duplicateMissionTitle);
        return false;
      }
      dispatch(renameMission({ missionId, newName: t }));
      const draft = localDraftMissionNamesRef.current;
      if (draft.has(current.name)) {
        draft.delete(current.name);
        draft.add(t);
      }
      return true;
    },
    [dispatch],
  );

  const saveMissionToServer = useCallback(
    (missionId: string, explicitIds?: string[]) => {
      const ent = store.getState().entities;
      const mission = ent.missionsById[missionId];
      if (!mission) return;
      localDraftMissionNamesRef.current.delete(mission.name);
      let refs = [...mission.entityRefs];
      if (explicitIds) {
        refs = explicitIds
          .map((id) => {
            const entity = ent.byId[id];
            return entity ? { id, type: entity.type } : null;
          })
          .filter((r): r is { id: string; type: Entity['type'] } => Boolean(r));
      }
      dispatch(setMissionEntityRefs({ missionId, entityRefs: refs }));
      sendMessage(WsMessageName.SaveMission, {
        mission_id: mission.id,
        mission_name: mission.name,
        entities: buildSaveMissionEntitiesField(refs, ent.byId),
      });
      dispatch(setActiveMissionId(missionId));
    },
    [dispatch, sendMessage],
  );

  const saveMissionCopyToServer = useCallback(async () => {
    const ent = store.getState().entities;
    if (!ent.activeMissionId) {
      await swalInfo(he.entities.sidebar.noActiveMission, he.entities.sidebar.noActiveMissionTitle);
      return;
    }
    const source = ent.missionsById[ent.activeMissionId];
    if (!source) return;
    const ids = missionEntityIds(source);
    const newName = pickMissionCopyName(source.name, ent.missionsList);
    const newId = createLocalMissionId();
    const refs = ids
      .map((id) => {
        const entity = ent.byId[id];
        return entity ? { id, type: entity.type } : null;
      })
      .filter((r): r is { id: string; type: Entity['type'] } => Boolean(r));
    dispatch(upsertMission({ id: newId, name: newName, entityRefs: refs }));
    saveMissionToServer(newId);
  }, [dispatch, saveMissionToServer]);

  return {
    localDraftMissionNamesRef,
    handleMissionMemberIdsChange,
    createLocalMission,
    handleMissionRename,
    saveMissionToServer,
    saveMissionCopyToServer,
    sendMessage,
  };
}

export function useEntityDuplicate(onRequestCloseEditPanel?: () => void) {
  const dispatch = useAppDispatch();
  const [duplicateSourceEntity, setDuplicateSourceEntity] = useState<Entity | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [duplicateCategory, setDuplicateCategory] = useState(EntityCategoryEnum.FREE);

  const openDuplicatePanel = useCallback(
    (entity: Entity) => {
      setDuplicateSourceEntity(entity);
      setDuplicateName(`${entity.name} - copy`);
      setDuplicateCategory(entity.category || EntityCategoryEnum.FREE);
      onRequestCloseEditPanel?.();
      dispatch(setSelectedEntity(null));
    },
    [dispatch, onRequestCloseEditPanel],
  );

  const closeDuplicatePanel = useCallback(() => {
    setDuplicateSourceEntity(null);
    setDuplicateName('');
    setDuplicateCategory(EntityCategoryEnum.FREE);
  }, []);

  const handleDuplicateSave = useCallback(() => {
    if (!duplicateSourceEntity) return;
    const name = duplicateName.trim();
    const category = duplicateCategory || EntityCategoryEnum.FREE;
    if (!name) return;
    const nextId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const now = Date.now();
    const duplicatedEntity: Entity = {
      ...duplicateSourceEntity,
      id: nextId,
      name,
      category,
      visible: true,
      createdAt: now,
      updatedAt: now,
      coordinates: duplicateSourceEntity.coordinates
        ? JSON.parse(JSON.stringify(duplicateSourceEntity.coordinates))
        : duplicateSourceEntity.coordinates,
      geometry: duplicateSourceEntity.geometry
        ? JSON.parse(JSON.stringify(duplicateSourceEntity.geometry))
        : duplicateSourceEntity.geometry,
      properties: duplicateSourceEntity.properties
        ? JSON.parse(JSON.stringify(duplicateSourceEntity.properties))
        : duplicateSourceEntity.properties,
    };
    dispatch(addEntity(duplicatedEntity));
    sendSaveEntity(
      duplicatedEntity.id,
      duplicatedEntity.category,
      duplicatedEntity.type,
      duplicatedEntity.coordinates ?? [],
      duplicatedEntity.name,
    );
    closeDuplicatePanel();
  }, [duplicateSourceEntity, duplicateName, duplicateCategory, dispatch, closeDuplicatePanel]);

  return {
    duplicateSourceEntity,
    duplicateName,
    setDuplicateName,
    duplicateCategory,
    setDuplicateCategory,
    openDuplicatePanel,
    closeDuplicatePanel,
    handleDuplicateSave,
  };
}
