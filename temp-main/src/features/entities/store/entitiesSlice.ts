import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { EntityType, TacticalEntity } from '@domain/models/entity';
import { mergeEntityUpdate, type EntityUpdatePatch } from '@domain/models/entity';
import { EntityCategoryEnum } from '@domain/enums/entity.enum';
import type { Mission, MissionEntityRef } from '@domain/models/mission';
import { createLocalMissionId, entityRefFromEntity } from '@domain/mappers/mission.mapper';

export type { Mission, MissionEntityRef };
export type Entity = TacticalEntity;

export interface EntitiesState {
  byId: Record<string, Entity>;
  allIds: string[];
  selectedId: string | null;
  isCreating: boolean;
  creationType: Entity['type'] | null;
  drawingMode: Entity['type'] | 'measure' | 'measure-area' | null;
  /** שמות משימות ממוינים — להצגה בסטטוס־בר */
  missionsList: string[];
  /** משימות מלאות לפי מזהה (שם, ישויות + סוג גיאומטרי) */
  missionsById: Record<string, Mission>;
  activeMissionId: string | null;
  missionListUiResetNonce: number;
  previewEntityId: string | null;
  selectedMarkerIcon: string | null;
  creationName: string;
  creationCategory: EntityCategoryEnum;
  creationHeight: number;
}

function rebuildMissionsList(missionsById: Record<string, Mission>): string[] {
  return [...new Set(Object.values(missionsById).map((m) => m.name).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'he')
  );
}

function replaceIdInMissionRefs(state: EntitiesState, oldId: string, newId: string, type: EntityType) {
  for (const m of Object.values(state.missionsById)) {
    m.entityRefs = m.entityRefs.map((r) =>
      r.id === oldId ? { id: newId, type: r.type ?? type } : r
    );
  }
}

function removeIdFromAllMissions(state: EntitiesState, id: string) {
  for (const m of Object.values(state.missionsById)) {
    m.entityRefs = m.entityRefs.filter((r) => r.id !== id);
  }
}

function findMissionIdByName(state: EntitiesState, name: string): string | null {
  const n = String(name ?? '').trim();
  if (!n) return null;
  for (const m of Object.values(state.missionsById)) {
    if (m.name === n) return m.id;
  }
  return null;
}

const initialState: EntitiesState = {
  byId: {},
  allIds: [],
  selectedId: null,
  isCreating: false,
  creationType: null,
  drawingMode: null,
  missionsList: [],
  missionsById: {},
  activeMissionId: null,
  missionListUiResetNonce: 0,
  previewEntityId: null,
  selectedMarkerIcon: null,
  creationName: '',
  creationCategory: EntityCategoryEnum.FREE,
  creationHeight: 0
};

const entitiesSlice = createSlice({
  name: 'entities',
  initialState,
  reducers: {
    addEntity: (state, action: PayloadAction<Entity>) => {
      const entity = action.payload;
      if (!entity?.id) return;

      state.byId[entity.id] = entity;
      state.allIds = state.allIds.filter((id) => id !== entity.id);
      state.allIds.push(entity.id);

      const missionId = state.activeMissionId;
      if (missionId && state.missionsById[missionId]) {
        const refs = state.missionsById[missionId].entityRefs;
        if (!refs.some((r) => r.id === entity.id)) {
          refs.push(entityRefFromEntity(entity));
        }
        state.missionsList = rebuildMissionsList(state.missionsById);
      }
    },

    updateEntity: (state, action: PayloadAction<EntityUpdatePatch & { id: string }>) => {
      const { id, ...rest } = action.payload;
      if (!id || !state.byId[id]) return;
      state.byId[id] = mergeEntityUpdate(state.byId[id], rest);
      const updates = rest;

      if (updates.type) {
        for (const m of Object.values(state.missionsById)) {
          m.entityRefs = m.entityRefs.map((r) =>
            r.id === id ? { ...r, type: updates.type as EntityType } : r
          );
        }
      }
    },

    confirmEntityCreated: (
      state,
      action: PayloadAction<{ localId: string; serverId: string }>
    ) => {
      const { localId, serverId } = action.payload;
      if (!localId || !serverId || localId === serverId) return;
      const entity = state.byId[localId];
      if (!entity) return;
      const nextEntity: Entity = {
        ...entity,
        id: serverId,
        updatedAt: Date.now(),
      };
      delete state.byId[localId];
      state.byId[serverId] = nextEntity;
      const index = state.allIds.indexOf(localId);
      if (index !== -1) state.allIds[index] = serverId;
      if (state.selectedId === localId) state.selectedId = serverId;
      if (state.previewEntityId === localId) state.previewEntityId = serverId;
      replaceIdInMissionRefs(state, localId, serverId, entity.type);
    },

    removeEntity: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.byId[id];
      state.allIds = state.allIds.filter(entityId => entityId !== id);
      if (state.selectedId === id) {
        state.selectedId = null;
      }
      if (state.previewEntityId === id) {
        state.previewEntityId = null;
      }
      removeIdFromAllMissions(state, id);
    },

    setSelectedEntity: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload;
    },

    setMissionList: (state, action: PayloadAction<string[]>) => {
      const list = [...new Set(action.payload.filter((x) => typeof x === 'string' && x.trim()))];
      list.sort((a, b) => a.localeCompare(b, 'he'));
      const allowedNames = new Set(list);
      for (const m of Object.values(state.missionsById)) {
        if (!allowedNames.has(m.name)) delete state.missionsById[m.id];
      }
      state.missionsList = list;
      if (state.activeMissionId) {
        const active = state.missionsById[state.activeMissionId];
        if (!active || !allowedNames.has(active.name)) {
          state.activeMissionId = null;
          state.previewEntityId = null;
        }
      }
    },

    setActiveMissionId: (state, action: PayloadAction<string | null>) => {
      const id = action.payload;
      state.activeMissionId = id && state.missionsById[id] ? id : null;
      state.previewEntityId = null;
    },

    /** תאימות: בחירה לפי שם משימה */
    setActiveMissionName: (state, action: PayloadAction<string | null>) => {
      const n = action.payload;
      if (!n || !String(n).trim()) {
        state.activeMissionId = null;
        state.previewEntityId = null;
        return;
      }
      const id = findMissionIdByName(state, String(n).trim());
      state.activeMissionId = id;
      state.previewEntityId = null;
    },

    requestMissionListUiReset: (state) => {
      state.missionListUiResetNonce += 1;
    },

    upsertMission: (state, action: PayloadAction<Mission>) => {
      const m = action.payload;
      if (!m?.id) return;
      const prev = state.missionsById[m.id];
      state.missionsById[m.id] = {
        id: m.id,
        name: String(m.name ?? prev?.name ?? m.id).trim() || m.id,
        entityRefs: m.entityRefs ?? prev?.entityRefs ?? [],
      };
      state.missionsList = rebuildMissionsList(state.missionsById);
    },

    upsertMissionName: (state, action: PayloadAction<string>) => {
      const n = String(action.payload ?? '').trim();
      if (!n) return;
      const existingId = findMissionIdByName(state, n);
      if (existingId) return;
      const id = createLocalMissionId();
      state.missionsById[id] = { id, name: n, entityRefs: [] };
      state.missionsList = rebuildMissionsList(state.missionsById);
    },

    renameMission: (
      state,
      action: PayloadAction<{ missionId: string; newName: string }>
    ) => {
      const { missionId, newName } = action.payload;
      const m = state.missionsById[missionId];
      const t = String(newName ?? '').trim();
      if (!m || !t || m.name === t) return;
      const duplicate = Object.values(state.missionsById).some(
        (x) => x.id !== missionId && x.name === t
      );
      if (duplicate) return;
      m.name = t;
      state.missionsList = rebuildMissionsList(state.missionsById);
    },

    removeMission: (state, action: PayloadAction<string>) => {
      const missionId = String(action.payload ?? '').trim();
      if (!missionId) return;
      delete state.missionsById[missionId];
      state.missionsList = rebuildMissionsList(state.missionsById);
      if (state.activeMissionId === missionId) {
        state.activeMissionId = null;
        state.previewEntityId = null;
      }
    },

    removeMissionMetadata: (state, action: PayloadAction<string>) => {
      const key = String(action.payload ?? '').trim();
      if (!key) return;
      const byId = state.missionsById[key] ? key : findMissionIdByName(state, key);
      if (!byId) return;
      delete state.missionsById[byId];
      state.missionsList = rebuildMissionsList(state.missionsById);
      if (state.activeMissionId === byId) {
        state.activeMissionId = null;
        state.previewEntityId = null;
      }
    },

    setMissionEntityRefs: (
      state,
      action: PayloadAction<{ missionId: string; entityRefs: MissionEntityRef[] }>
    ) => {
      const { missionId, entityRefs } = action.payload;
      const id = String(missionId ?? '').trim();
      if (!id || !state.missionsById[id]) return;
      state.missionsById[id].entityRefs = entityRefs.map((r) => ({ id: r.id, type: r.type }));
    },

    /** תאימות — מזהים בלבד (סוג יילקח מ־byId) */
    setMissionEntityIds: (
      state,
      action: PayloadAction<{ missionName: string; entityIds: string[] }>
    ) => {
      const { missionName, entityIds } = action.payload;
      const mn = String(missionName ?? '').trim();
      if (!mn) return;
      let missionId = findMissionIdByName(state, mn);
      if (!missionId) {
        missionId = createLocalMissionId();
        state.missionsById[missionId] = { id: missionId, name: mn, entityRefs: [] };
      }
      const refs: MissionEntityRef[] = [];
      for (const eid of entityIds) {
        const entity = state.byId[eid];
        if (!entity) continue;
        refs.push({ id: eid, type: entity.type });
      }
      state.missionsById[missionId].entityRefs = refs;
      state.missionsList = rebuildMissionsList(state.missionsById);
    },

    setMissionsFromServer: (state, action: PayloadAction<Mission[]>) => {
      for (const m of action.payload) {
        if (!m?.id) continue;
        const prev = state.missionsById[m.id];
        state.missionsById[m.id] = {
          id: m.id,
          name: m.name || prev?.name || m.id,
          entityRefs: m.entityRefs.length ? m.entityRefs : (prev?.entityRefs ?? []),
        };
      }
      state.missionsList = rebuildMissionsList(state.missionsById);
    },

    setPreviewEntityId: (state, action: PayloadAction<string | null>) => {
      state.previewEntityId = action.payload;
    },

    toggleEntityVisibility: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.byId[id]) {
        state.byId[id].visible = !state.byId[id].visible;
      }
    },

    setCreationMode: (state, action: PayloadAction<{ isCreating: boolean; type?: Entity['type'] }>) => {
      state.isCreating = action.payload.isCreating;
      state.creationType = action.payload.type || null;
    },

    setEntities: (state, action: PayloadAction<Entity[]>) => {
      state.byId = {};
      state.allIds = [];
      action.payload.forEach(entity => {
        state.byId[entity.id] = entity;
        state.allIds.push(entity.id);
      });
    },
    setDrawingMode: (state, action: PayloadAction<Entity['type'] | 'measure' | 'measure-area' | null>) => {
      state.drawingMode = action.payload;
    },

    setSelectedMarkerIcon: (state, action: PayloadAction<string | null>) => {
      state.selectedMarkerIcon = action.payload;
    },

    setCreationForm: (state, action: PayloadAction<{ name: string; category: EntityCategoryEnum; height?: number }>) => {
      state.creationName = action.payload.name;
      state.creationCategory = action.payload.category;
      if (typeof action.payload.height === 'number' && Number.isFinite(action.payload.height)) {
        state.creationHeight = action.payload.height;
      }
    },

    clearEntities: (state) => {
      state.byId = {};
      state.allIds = [];
      state.selectedId = null;
      state.previewEntityId = null;
      for (const m of Object.values(state.missionsById)) {
        m.entityRefs = [];
      }
      state.isCreating = false;
      state.creationType = null;
      state.drawingMode = null;
      state.selectedMarkerIcon = null;
      state.creationName = '';
      state.creationCategory = EntityCategoryEnum.FREE;
      state.creationHeight = 0;
    }
  }
});

export const {
  addEntity,
  updateEntity,
  removeEntity,
  setSelectedEntity,
  toggleEntityVisibility,
  confirmEntityCreated,
  setCreationMode,
  setDrawingMode,
  setSelectedMarkerIcon,
  setCreationForm,
  setEntities,
  clearEntities,
  setMissionList,
  setActiveMissionId,
  setActiveMissionName,
  requestMissionListUiReset,
  upsertMission,
  upsertMissionName,
  renameMission,
  removeMission,
  removeMissionMetadata,
  setMissionEntityRefs,
  setMissionEntityIds,
  setMissionsFromServer,
  setPreviewEntityId
} = entitiesSlice.actions;

export default entitiesSlice.reducer;
