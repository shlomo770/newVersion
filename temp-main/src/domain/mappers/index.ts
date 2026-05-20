export {
  buildGeometryForCreate,
} from './entityGeometry.mapper';

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
} from './entityWire.mapper';
export type {
  SaveEntityPayload,
  SaveEntityShapeParams,
  SaveEntityWireType,
  UpdateEntityPayload,
} from './entityWire.mapper';

export { normalizeRawEntityToStore } from './entityInbound.mapper';

export {
  buildSaveMissionEntitiesField,
  createLocalMissionId,
  entityRefFromEntity,
  mergeMissionEntityRefs,
  missionEntityIds,
  parseMissionEntityRefs,
  parseMissionFromServer,
  parseMissionsListFromServer,
} from './mission.mapper';

export {
  RADAR_PARAM_KEYS,
  buildSetRadarParamsPayload,
  mapRadarWireStateToStatus,
  normalizeInboundRadarParamsWire,
} from './radarWire.mapper';
export type { RadarParamKey, RadarParamsPatch } from './radarWire.mapper';
