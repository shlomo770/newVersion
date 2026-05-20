import { WebSocketService } from '@/services/webSocket/WebSocketService';
import { WsMessageName } from '@domain/enums/ws.enum';
import type { EntityCategoryEnum } from '@domain/enums/entity.enum';
import type { EntityType } from '@domain/models/entity';
import type { Coordinates } from '@domain/models/coordinates';
import type { TacticalEntity } from '@domain/models/entity';
import type { Mission } from '@domain/models/mission';
import {
  buildCircleCoordinatesFromPointRadius,
  buildEllipseCoordinatesFromCenterRadii,
  buildSaveEntityPayload,
  buildUpdateEntityPayload,
  normalizeCoordinates,
  toEntityCategoryEnum,
  toLocalEntityCategory,
  toLocalEntityType,
  toServerEntityCategory,
  toServerEntityType,
} from '@domain/mappers/entityWire.mapper';
import type {
  SaveEntityPayload,
  SaveEntityShapeParams,
  SaveEntityWireType,
  UpdateEntityPayload,
} from '@domain/mappers/entityWire.mapper';
import {
  buildSaveMissionEntitiesField,
  createLocalMissionId,
  entityRefFromEntity,
  mergeMissionEntityRefs,
  missionEntityIds,
  parseMissionEntityRefs,
  parseMissionFromServer,
  parseMissionsListFromServer,
} from '@domain/mappers/mission.mapper';
import type { SaveMissionEntityWire } from '@domain/models/mission';

export type {
  SaveEntityPayload,
  SaveEntityShapeParams,
  SaveEntityWireType,
  UpdateEntityPayload,
  SaveMissionEntityWire,
};

export {
  buildCircleCoordinatesFromPointRadius,
  buildEllipseCoordinatesFromCenterRadii,
  buildSaveEntityPayload,
  buildUpdateEntityPayload,
  normalizeCoordinates,
  toEntityCategoryEnum,
  toLocalEntityCategory,
  toLocalEntityType,
  toServerEntityCategory,
  toServerEntityType,
  buildSaveMissionEntitiesField,
  createLocalMissionId,
  entityRefFromEntity,
  mergeMissionEntityRefs,
  missionEntityIds,
  parseMissionEntityRefs,
  parseMissionFromServer,
  parseMissionsListFromServer,
};

export interface SaveMissionWirePayload {
  mission_id: string;
  mission_name: string;
  entities: string;
}

export function buildSaveMissionWirePayload(
  mission: Pick<Mission, 'id' | 'name' | 'entityRefs'>,
  byId: Record<string, TacticalEntity | undefined>,
): SaveMissionWirePayload {
  return {
    mission_id: mission.id,
    mission_name: mission.name,
    entities: buildSaveMissionEntitiesField(mission.entityRefs, byId),
  };
}

export function sendSaveEntity(
  id: string,
  localCategory: EntityCategoryEnum,
  localType: EntityType,
  coordinates: Coordinates[],
  name: string,
): boolean {
  const payload = buildSaveEntityPayload(id, localCategory, localType, coordinates, name);
  if (!payload) {
    return false;
  }
  const wirePayload = {
    ...payload,
    type: toEntityCategoryEnum(payload.type),
  };
  WebSocketService.getInstance().sendMessage(WsMessageName.SaveEntity, wirePayload);
  return true;
}

export function sendUpdateEntity(
  id: string,
  localCategory: EntityCategoryEnum,
  localType: EntityType,
  coordinates: Coordinates[],
  name: string,
): boolean {
  const payload = buildUpdateEntityPayload(id, localCategory, localType, coordinates, name);
  if (!payload) {
    return false;
  }
  const wirePayload = {
    ...payload,
    type: toEntityCategoryEnum(payload.type),
  } satisfies import('@/services/webSocket/wsTypes').UpdateEntityOutboundPayload;
  WebSocketService.getInstance().sendMessage(WsMessageName.UpdateEntity, wirePayload);
  return true;
}

export function sendSaveMission(
  mission: Pick<Mission, 'id' | 'name' | 'entityRefs'>,
  byId: Record<string, TacticalEntity | undefined>,
): void {
  const payload = buildSaveMissionWirePayload(mission, byId);
  WebSocketService.getInstance().sendMessage(WsMessageName.SaveMission, payload);
}

export function sendDeleteEntity(entityId: string): void {
  WebSocketService.getInstance().sendMessage(WsMessageName.EntityDeleted, { entityId });
}

export function sendLoadMission(missionId: string): void {
  WebSocketService.getInstance().sendMessage(WsMessageName.LoadMission, { mission_id: missionId });
}

export function sendDeleteMission(missionId: string): void {
  WebSocketService.getInstance().sendMessage(WsMessageName.DeleteMission, { mission_id: missionId });
}

export function sendGetMissionsList(): void {
  WebSocketService.getInstance().sendMessage(WsMessageName.GetMissionsList, {});
}
