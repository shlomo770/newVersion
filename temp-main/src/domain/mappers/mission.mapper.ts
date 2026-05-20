import type { Mission, MissionEntityRef, SaveMissionEntityWire } from '../models/mission';
import type { EntityType, TacticalEntity } from '../models/entity';
import { toLocalEntityType, toServerEntityType } from './entityWire.mapper';
import { isPlainObject, readString } from '../utils/record';

export function missionEntityIds(mission: Mission): string[] {
  return mission.entityRefs.map((reference) => reference.id);
}

export function createLocalMissionId(): string {
  return `mission-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeRawEntityTypeFromObject(record: Record<string, unknown>): EntityType | null {
  return toLocalEntityType(String(record.type ?? record.entity_type ?? record.entityType ?? ''));
}

export function parseMissionEntityRefs(
  raw: unknown,
  byId?: Record<string, TacticalEntity | undefined>
): MissionEntityRef[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const output: MissionEntityRef[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    let id = '';
    let type: EntityType | null = null;

    if (typeof item === 'string' || typeof item === 'number') {
      id = String(item).trim();
      type = byId?.[id]?.type ?? null;
    } else if (isPlainObject(item)) {
      id = readString(item, 'id', 'entityId', 'entity_id');
      const rawType = item.type ?? item.entity_type ?? item.entityType;
      if (rawType != null && String(rawType).trim()) {
        type = toLocalEntityType(String(rawType));
      }
      if (!type && byId?.[id]?.type) {
        type = byId[id]!.type;
      }
      if (!type && item.coordinates != null) {
        type = normalizeRawEntityTypeFromObject(item);
      }
    }

    if (!id || seen.has(id) || !type) {
      continue;
    }

    seen.add(id);
    output.push({ id, type });
  }

  return output;
}

export function parseMissionFromServer(
  raw: unknown,
  byId?: Record<string, TacticalEntity | undefined>
): Mission | null {
  if (!isPlainObject(raw)) {
    return null;
  }

  const name =
    readString(raw, 'name', 'mission_name') || readString(raw, 'id', 'mission_id');
  const id = readString(raw, 'id', 'mission_id') || name;
  if (!id) {
    return null;
  }

  const idsRaw = raw.ids ?? raw.entityIds ?? raw.entity_ids ?? raw.entities;
  const entityRefs = parseMissionEntityRefs(idsRaw, byId);

  return {
    id,
    name: name || id,
    entityRefs,
  };
}

export function parseMissionsListFromServer(raw: unknown[]): Mission[] {
  const output: Mission[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (!trimmed || seen.has(trimmed)) {
        continue;
      }
      seen.add(trimmed);
      output.push({ id: trimmed, name: trimmed, entityRefs: [] });
      continue;
    }

    const mission = parseMissionFromServer(item);
    if (!mission || seen.has(mission.id)) {
      continue;
    }
    seen.add(mission.id);
    output.push(mission);
  }

  return output;
}

export function buildSaveMissionEntitiesField(
  entityRefs: MissionEntityRef[],
  byId: Record<string, TacticalEntity | undefined>
): string {
  const wire: SaveMissionEntityWire[] = [];
  const seen = new Set<string>();

  for (const reference of entityRefs) {
    const id = String(reference.id ?? '').trim();
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);

    const entity = byId[id];
    const localType = reference.type ?? entity?.type;
    const serverType = localType ? toServerEntityType(localType) : '';
    if (!serverType) {
      continue;
    }

    wire.push({ id, type: serverType });
  }

  return JSON.stringify(wire);
}

export function mergeMissionEntityRefs(
  refs: MissionEntityRef[],
  byId: Record<string, TacticalEntity | undefined>
): MissionEntityRef[] {
  return refs
    .map((reference) => ({
      id: reference.id,
      type: reference.type ?? byId[reference.id]?.type ?? reference.type,
    }))
    .filter((reference): reference is MissionEntityRef => Boolean(reference.id && reference.type));
}

export function entityRefFromEntity(entity: TacticalEntity): MissionEntityRef {
  return { id: entity.id, type: entity.type };
}
