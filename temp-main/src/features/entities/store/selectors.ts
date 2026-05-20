import type { RootState } from '@app/store';
import type { Entity } from './entitiesSlice';
import { missionEntityIds } from '@domain/mappers/mission.mapper';

/**
 * ישויות להצגה במפה:
 * - ללא משימה פעילה: כל מה שב־`byId`.
 * - עם משימה פעילה: רק מזהים במשימה הפעילה שקיימים ב־`byId`.
 */
export function selectEntitiesForMap(state: RootState): Record<string, Entity> {
  const { byId, activeMissionId, missionsById } = state.entities;
  if (!activeMissionId) {
    return byId;
  }
  const mission = missionsById[activeMissionId];
  const ids = mission ? missionEntityIds(mission) : [];
  const out: Record<string, Entity> = {};
  for (const id of ids) {
    const entity = byId[id];
    if (entity) {
      out[id] = entity;
    }
  }
  return out;
}

export function selectDisplayedEntitiesOnMap(state: RootState): Record<string, Entity> {
  const base = selectEntitiesForMap(state);
  const { previewEntityId: pid, activeMissionId } = state.entities;
  if (!pid || !activeMissionId) {
    return base;
  }
  const entity = state.entities.byId[pid];
  if (!entity) {
    return base;
  }
  if (base[pid]) {
    return base;
  }
  return { ...base, [pid]: entity };
}

export function selectAllEntitiesById(state: RootState): Record<string, Entity> {
  return state.entities.byId;
}

export function selectActiveMissionName(state: RootState): string | null {
  const { activeMissionId, missionsById } = state.entities;
  if (!activeMissionId) {
    return null;
  }
  return missionsById[activeMissionId]?.name ?? null;
}

export function selectMissionsForStatusBar(state: RootState): { id: string; name: string }[] {
  return Object.values(state.entities.missionsById)
    .map((mission) => ({ id: mission.id, name: mission.name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'he'));
}
