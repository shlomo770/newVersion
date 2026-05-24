export { default as mapReducer } from './store/mapSlice';
export { default as filterReducer } from './store/filterSlice';
export { default as settingsReducer } from './store/settingsSlice';
export { default as coordinatesReducer } from './store/coordinatesSlice';
export { default as elevationReducer } from './store/elevationSlice';
export { default as losReducer } from './store/losSlice';

export {
  setRotation,
  setBrightness,
  setCenter,
  setZoom,
  setMapType,
  resetMap,
} from './store/mapSlice';

export {
  setTargetTrailsVisible,
  toggleTargetTrailsVisible,
  setTargetLabelsVisible,
  toggleTargetLabelsVisible,
  setTargetPanelVisible,
  toggleTargetPanelVisible,
} from './store/filterSlice';

export {
  setInactiveTargetTimeout,
  setDisconnectedTargetTimeout,
  setDestroyedTargetDelay,
  setLosSectorColor,
  setCategoryColor,
  setCategoryOpacity,
  initializeCategory,
  resetToDefaults,
} from './store/settingsSlice';

export {
  toggleCoordinateSystem,
  setCoordinateSystem,
  setUTMZone,
} from './store/coordinatesSlice';

export {
  setElevation,
  setElevationLoading,
  setLastCoordinates,
  clearElevation,
} from './store/elevationSlice';

export { setLOS, clearLOS } from './store/losSlice';
export type { LosState, LosRay } from './store/losSlice';

export { default as BaseMapSelector } from './components/BaseMapSelector';

export { default as MapContainer } from './ui/MapContainer';
export type { MapContainerProps } from './ui/MapContainer';

export { MapFacade } from './services/MapFacade';
export type { JsonPathInput } from './services/MapFacade';
export type { MapDrawingUiState } from './services/mapDrawingTypes';

export {
  useMapDrawing,
  useMapEntities,
  useMapMeasurement,
  useMapViewport,
  useMapBearing,
  useOverlayScreenPosition,
  useMapCoordinateClick,
  useMapContextMenu,
} from './hooks';

export type { MapContextMenuActions } from './hooks';

export { default as MapTacticalLayers } from './layers/MapTacticalLayers';
export type { MapTacticalLayersProps } from './layers/MapTacticalLayers';
export type { FilterState } from './store/filterSlice';
