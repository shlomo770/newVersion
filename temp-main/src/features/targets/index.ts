export { default as targetsReducer } from './store/targetsSlice';

export type { Target, TargetsState } from './store/targetsSlice';

export {
  addTarget,
  updateTarget,
  removeTarget,
  clearTargets,
  markAsDisconnected,
  updateTrail,
  setTargetRecommendation,
  clearAllRecommendations,
  setTargetAssigned,
  setTargetLocked,
  sortByType,
  clearTargetAssignment,
  setTargetLineLayer,
  setTargetIconLayer,
  clearTargetLayers,
  markTargetAsDestroyed,
} from './store/targetsSlice';

export { TargetPanel } from './ui/TargetPanel';
export type { TargetPanelProps } from './ui/TargetPanel';

export { useTargetCommands } from './hooks/useTargetCommands';
export { useTargetStatusLifecycle } from './hooks/useTargetStatusLifecycle';
