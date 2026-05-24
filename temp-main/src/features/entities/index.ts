export { default as entitiesReducer } from './store/entitiesSlice';

export type { Entity, EntitiesState, Mission, MissionEntityRef } from './store/entitiesSlice';

export {
  addEntity,
  updateEntity,
  removeEntity,
  setSelectedEntity,
  setActiveEditEntityId,
  toggleEntityVisibility,
  confirmEntityCreated,
  setCreationMode,
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
  setPreviewEntityId,
} from './store/entitiesSlice';

export {
  selectEntitiesForMap,
  selectDisplayedEntitiesOnMap,
  selectAllEntitiesById,
  selectActiveMissionName,
  selectMissionsForStatusBar,
} from './store/selectors';

export { default as EntitiesManager } from './ui/EntitiesManager';
export { default as EntitiesSidebar } from './ui/EntitiesSidebar';
export { default as EntitiesButton } from './ui/EntitiesButton';

export {
  buildSaveEntityPayload,
  buildUpdateEntityPayload,
  buildSaveMissionEntitiesField,
  buildSaveMissionWirePayload,
  toEntityCategoryEnum,
  sendSaveEntity,
  sendUpdateEntity,
  sendSaveMission,
  sendDeleteEntity,
  sendLoadMission,
  sendDeleteMission,
  sendGetMissionsList,
} from './api/outboundBuilders';

export type {
  SaveEntityPayload,
  SaveEntityWireType,
  UpdateEntityPayload,
  SaveMissionWirePayload,
} from './api/outboundBuilders';
