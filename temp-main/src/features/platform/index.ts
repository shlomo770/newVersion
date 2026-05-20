export { default as radarReducer } from './store/radarSlice';
export { default as gunReducer } from './store/gunSlice';
export { default as insReducer } from './store/insSlice';
export { default as myPositionReducer } from './store/myPositionSlice';

export type { RadarState, RadarValues } from './store/radarSlice';

export {
  updateServerValues,
  receiveRadarParamsFromServer,
  updateFormValue,
  compareWithServer,
  resetRadarState,
  setFormOpen,
  setStatus,
  setRadarNonCoverage,
  hydrateFormFromServer,
} from './store/radarSlice';

export {
  RADAR_PARAM_KEYS,
  buildSetRadarParamsPayload,
  mapRadarWireStateToStatus,
  normalizeInboundRadarParamsWire,
} from '@domain/mappers/radarWire.mapper';

export type { RadarParamKey, RadarParamsPatch } from '@domain/mappers/radarWire.mapper';

export { updateGunStatus, clearGunStatus, setGunStatus } from './store/gunSlice';

export type { GunStatus, GunState } from './store/gunSlice';

export { setInsStatus } from './store/insSlice';

export type { InsStatus } from './store/insSlice';

export {
  setMyPosition,
  updateMyPosition,
  updateMyCoordinates,
  updateClickCord,
  updateMyHeading,
  clearMyPosition,
  updateGunAzimut,
  updateMyCali,
} from './store/myPositionSlice';

export { default as RadarForm } from './ui/RadarForm';
export { default as LocationForm, formatOneDecimal } from './ui/LocationForm';
