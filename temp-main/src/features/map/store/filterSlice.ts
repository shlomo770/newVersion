import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  TARGET_TYPE_DEFAULTS,
  TARGET_VISIBILITY_DEFAULTS,
} from '@features/targets/config';

/**
 * Filter slice — the single source of truth for everything the user can
 * toggle in the map's filter UI:
 *
 *  - `targets`           — friend / hostile / unknown / all type filter.
 *  - `targetVisibility`  — independent toggles for trails, labels, and
 *                          the right-side cards panel.
 *
 * The slice keeps **no panel/dialog state** of its own — opening/closing
 * the filter menu is a transient UI concern owned by the component that
 * renders it.
 */

export interface FilterState {
  targets: {
    all: boolean;
    friendly: boolean;
    hostile: boolean;
    unknown: boolean;
  };
  /** Independent visibility flags for sub-layers of the targets feature. */
  targetVisibility: {
    trails: boolean;
    labels: boolean;
    /** UI panel that lists target cards. */
    panel: boolean;
  };
}

const initialState: FilterState = {
  targets: { ...TARGET_TYPE_DEFAULTS },
  targetVisibility: { ...TARGET_VISIBILITY_DEFAULTS },
};

const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setTargetTypeVisible: (
      state,
      action: PayloadAction<{ type: keyof FilterState['targets']; visible: boolean }>,
    ) => {
      state.targets[action.payload.type] = action.payload.visible;
    },
    toggleTargetType: (
      state,
      action: PayloadAction<keyof FilterState['targets']>,
    ) => {
      state.targets[action.payload] = !state.targets[action.payload];
    },

    setTargetTrailsVisible: (state, action: PayloadAction<boolean>) => {
      state.targetVisibility.trails = action.payload;
    },
    toggleTargetTrailsVisible: (state) => {
      state.targetVisibility.trails = !state.targetVisibility.trails;
    },

    setTargetLabelsVisible: (state, action: PayloadAction<boolean>) => {
      state.targetVisibility.labels = action.payload;
    },
    toggleTargetLabelsVisible: (state) => {
      state.targetVisibility.labels = !state.targetVisibility.labels;
    },

    setTargetPanelVisible: (state, action: PayloadAction<boolean>) => {
      state.targetVisibility.panel = action.payload;
    },
    toggleTargetPanelVisible: (state) => {
      state.targetVisibility.panel = !state.targetVisibility.panel;
    },
  },
});

export const {
  setTargetTypeVisible,
  toggleTargetType,
  setTargetTrailsVisible,
  toggleTargetTrailsVisible,
  setTargetLabelsVisible,
  toggleTargetLabelsVisible,
  setTargetPanelVisible,
  toggleTargetPanelVisible,
} = filterSlice.actions;

export default filterSlice.reducer;
