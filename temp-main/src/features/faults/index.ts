export { default as faultsReducer } from './store/faultsSlice';

export type { ServerFault, Fault, FaultsState } from './store/faultsSlice';

export {
  setCategorySnapshot,
  clearAllFaults,
  setSelectedCategories,
  setSeverityFilter,
  setShowInactive,
  acknowledgeAll,
  acknowledgeOne,
  dismissPopup,
  popNextPopup,
} from './store/faultsSlice';

export {
  getBadge,
  selectCategories,
  selectAllFaultsFlat,
  selectFilteredFaults,
  selectMasterCautionOn,
  selectPopupQueue,
} from './store/faultsSlice';

export { default as ToastHost } from './ui/ToastHost';
export { MasterCautionLight } from './ui/MasterCautionLight';
export { default as FaultsList } from './ui/FaultsList';

export { mapPayloadToSnapshot } from './api/faultsPayload';
export type { DeviceSnapshot, FaultWireItem } from './api/faultsPayload';
