import type { Store } from 'redux';
import type { MessageRegistry } from '@core/ws/messageRegistry';
import type { InboundHandlerContext } from '@core/ws/types';
import { WsMessageName } from '@domain/enums/ws.enum';
import {
  addEntity,
  confirmEntityCreated,
  removeEntity,
  setMissionList,
  setActiveMissionId,
  setMissionsFromServer,
  upsertMission,
} from '../store/entitiesSlice';
import {
  parseMissionEntityRefs,
  parseMissionFromServer,
  parseMissionsListFromServer,
} from './missionWire';
import { normalizeRawEntityToStore } from './entityInboundNormalize';
import type { TacticalEntity } from '@domain/models/entity';
import { ingestGetDbTypedPayload, isTypedGetDbPayload } from './getDbSpecNormalize';

function asRecord(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  return data as Record<string, unknown>;
}

function readStringField(record: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function applyMissionsListPayload(data: unknown, store: Store): void {
  if (data == null) return;
  let raw: unknown[] = [];
  if (Array.isArray(data)) {
    raw = data;
  } else if (typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.missions)) raw = d.missions as unknown[];
    else if (Array.isArray(d.list)) raw = d.list as unknown[];
    else raw = Object.values(d);
  }
  const fromServer = parseMissionsListFromServer(raw);
  const state = store.getState() as { entities: { activeMissionId: string | null; missionsById: Record<string, { name: string }>; missionsList: string[] } };
  const activeId = state.entities.activeMissionId;
  const activeName = activeId ? state.entities.missionsById[activeId]?.name : null;
  const prev = state.entities.missionsList;

  if (fromServer.length) {
    store.dispatch(setMissionsFromServer(fromServer));
  }

  let list: string[];
  if (fromServer.length === 0) {
    list = prev.length ? [...prev] : [];
    if (activeName && !list.includes(activeName)) list = [...list, activeName];
  } else {
    const names = fromServer.map((m) => m.name);
    list = [...new Set([...names, ...prev])];
    if (activeName && !list.includes(activeName)) list = [...list, activeName];
  }
  list.sort((a, b) => a.localeCompare(b, 'he'));
  store.dispatch(setMissionList(list));
}

function parseMissionEntitiesField(entitiesField: unknown): unknown[] {
  if (entitiesField == null) return [];
  if (Array.isArray(entitiesField)) return entitiesField;
  if (typeof entitiesField === 'string') {
    try {
      const parsed: unknown = JSON.parse(entitiesField);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') return Object.values(parsed as Record<string, unknown>);
    } catch {
      return [];
    }
    return [];
  }
  return [];
}

function pickExplicitMissionEntityIdList(payload: Record<string, unknown>): string[] | null {
  const keys = [
    'entityIds',
    'entity_ids',
    'ids',
    'mission_entity_ids',
    'member_ids',
    'entities_ids',
  ];
  for (const k of keys) {
    const v = payload[k];
    if (!Array.isArray(v) || v.length === 0) continue;
    const out = v.map((x) => String(x).trim()).filter(Boolean);
    if (out.length) return [...new Set(out)];
  }
  return null;
}

function applyMissionDataPayload(data: unknown, store: Store): void {
  const d = asRecord(data);
  if (!d) return;
  const entitiesArray = parseMissionEntitiesField(d.entities);
  const missionId =
    readStringField(d, 'mission_id', 'id') || readStringField(d, 'mission_name') || '';
  const missionName = readStringField(d, 'mission_name', 'name') || missionId;
  if (!missionId) return;

  const inferredIds: string[] = [];
  for (const raw of entitiesArray) {
    const entity = normalizeRawEntityToStore(raw);
    if (!entity?.id) continue;
    store.dispatch(addEntity(entity));
    inferredIds.push(entity.id);
  }

  const st = store.getState() as { entities: { byId: Record<string, TacticalEntity> } };
  const explicitIds = pickExplicitMissionEntityIdList(d);
  const entityRefs = parseMissionEntityRefs(
    explicitIds?.length ? explicitIds : entitiesArray.length ? entitiesArray : inferredIds,
    st.entities.byId,
  );

  store.dispatch(
    upsertMission({
      id: missionId,
      name: missionName,
      entityRefs,
    }),
  );
  store.dispatch(setActiveMissionId(missionId));
}

function unwrapGetDbPayload(data: unknown): Record<string, unknown> | null {
  const d = asRecord(data);
  if (!d) return null;
  const nested =
    d.data ?? d.payload ?? d.result ?? d.body ?? d.db ?? d.GET_DB ?? d.content ?? d.response;
  const inner =
    nested && typeof nested === 'object' && !Array.isArray(nested)
      ? (nested as Record<string, unknown>)
      : null;

  if (inner && isTypedGetDbPayload(inner)) return inner;
  if (isTypedGetDbPayload(d)) return d;

  const hasLegacy = (o: Record<string, unknown>) =>
    Array.isArray(o.entities as unknown[]) ||
    Array.isArray(o.Entities as unknown[]) ||
    Array.isArray(o.missions as unknown[]) ||
    Array.isArray(o.Missions as unknown[]);

  if (hasLegacy(d)) return d;
  if (inner && hasLegacy(inner)) return inner;
  return d;
}

function applyGetDbPayload(data: unknown, store: Store): void {
  const unwrapped = unwrapGetDbPayload(data);
  if (!unwrapped) return;
  if (isTypedGetDbPayload(unwrapped)) {
    ingestGetDbTypedPayload(store, unwrapped);
    return;
  }
  const rawEntities = unwrapped.entities ?? unwrapped.Entities;
  const rawMissions = unwrapped.missions ?? unwrapped.Missions;

  if (Array.isArray(rawEntities)) {
    for (const raw of rawEntities) {
      const e = normalizeRawEntityToStore(raw);
      if (e) store.dispatch(addEntity(e));
    }
  }

  if (Array.isArray(rawMissions)) {
    const st = store.getState() as { entities: { byId: Record<string, TacticalEntity> } };
    const parsed = [];
    for (const m of rawMissions) {
      const mission = parseMissionFromServer(m, st.entities.byId);
      if (mission) parsed.push(mission);
    }
    if (parsed.length) {
      store.dispatch(setMissionsFromServer(parsed));
      const uniqueNames = [...new Set(parsed.map((x) => x.name))].sort((a, b) =>
        a.localeCompare(b, 'he'),
      );
      store.dispatch(setMissionList(uniqueNames));
    }
  }
}

function handleEntityDeleted(data: unknown, { store }: InboundHandlerContext): void {
  const raw = asRecord(data) ?? {};
  const entityId = readStringField(raw, 'entityId', 'id');
  if (!entityId) return;
  store.dispatch(removeEntity(entityId));
}

function handleEntityCreated(data: unknown, { store }: InboundHandlerContext): void {
  const d = asRecord(data);
  if (!d) return;
  const serverId = readStringField(d, 'new_id');
  const localId = readStringField(d, 'temp_id');
  if (!serverId || !localId) return;
  store.dispatch(confirmEntityCreated({ localId, serverId }));
}

function handleMissionsList(data: unknown, { store }: InboundHandlerContext): void {
  applyMissionsListPayload(data, store);
}

function handleGetDb(data: unknown, { store }: InboundHandlerContext): void {
  applyGetDbPayload(data, store);
}

function handleMissionData(data: unknown, { store }: InboundHandlerContext): void {
  applyMissionDataPayload(data, store);
}

/**
 * Registers entity and mission inbound WebSocket handlers on the core registry.
 */
export function registerEntitiesInboundHandlers(registry: MessageRegistry): void {
  registry.registerMany({
    [WsMessageName.EntityDeleted]: handleEntityDeleted,
    [WsMessageName.MissionsList]: handleMissionsList,
    [WsMessageName.MissionsListUpdate]: handleMissionsList,
    [WsMessageName.GetDb]: handleGetDb,
    [WsMessageName.MissionData]: handleMissionData,
    [WsMessageName.MissionDataUpdate]: handleMissionData,
    [WsMessageName.EntityCreated]: handleEntityCreated,
  });
}
