import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  CATEGORY_VISUAL_DEFAULT,
  LOS_SECTOR_DEFAULT_COLOR,
  LOS_SECTOR_RESET_COLOR,
  TARGET_LIFECYCLE_DEFAULTS,
} from '../config/mapDefaults.config';

export interface CategoryVisual {
  color: string;
  opacity: number;
}

export interface SettingsState {
  inactiveTargetTimeoutSec: number;
  disconnectedTargetTimeoutSec: number;
  destroyedTargetRemoveDelaySec: number;
  losSectorColor: string;
  categoryVisuals: {
    [categoryName: string]: CategoryVisual;
  };
}

const initialState: SettingsState = {
  inactiveTargetTimeoutSec: TARGET_LIFECYCLE_DEFAULTS.inactiveTargetTimeoutSec,
  disconnectedTargetTimeoutSec: TARGET_LIFECYCLE_DEFAULTS.disconnectedTargetTimeoutSec,
  destroyedTargetRemoveDelaySec: TARGET_LIFECYCLE_DEFAULTS.destroyedTargetRemoveDelaySec,
  losSectorColor: LOS_SECTOR_DEFAULT_COLOR,
  categoryVisuals: {},
};

const cloneCategoryDefault = (): CategoryVisual => ({
  color: CATEGORY_VISUAL_DEFAULT.color,
  opacity: CATEGORY_VISUAL_DEFAULT.opacity,
});

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setInactiveTargetTimeout: (state, action: PayloadAction<number>) => {
      state.inactiveTargetTimeoutSec = action.payload;
    },

    setDisconnectedTargetTimeout: (state, action: PayloadAction<number>) => {
      state.disconnectedTargetTimeoutSec = action.payload;
    },

    setDestroyedTargetDelay: (state, action: PayloadAction<number>) => {
      state.destroyedTargetRemoveDelaySec = action.payload;
    },

    setLosSectorColor: (state, action: PayloadAction<string>) => {
      state.losSectorColor = action.payload;
    },

    setCategoryColor: (state, action: PayloadAction<{ category: string; color: string }>) => {
      const { category, color } = action.payload;
      if (!state.categoryVisuals[category]) {
        state.categoryVisuals[category] = cloneCategoryDefault();
      }
      state.categoryVisuals[category].color = color;
    },

    setCategoryOpacity: (state, action: PayloadAction<{ category: string; opacity: number }>) => {
      const { category, opacity } = action.payload;
      if (!state.categoryVisuals[category]) {
        state.categoryVisuals[category] = cloneCategoryDefault();
      }
      state.categoryVisuals[category].opacity = opacity;
    },

    initializeCategory: (state, action: PayloadAction<string>) => {
      const category = action.payload;
      if (!state.categoryVisuals[category]) {
        state.categoryVisuals[category] = cloneCategoryDefault();
      }
    },

    resetToDefaults: (state) => {
      state.inactiveTargetTimeoutSec = TARGET_LIFECYCLE_DEFAULTS.inactiveTargetTimeoutSec;
      state.disconnectedTargetTimeoutSec = TARGET_LIFECYCLE_DEFAULTS.disconnectedTargetTimeoutSec;
      state.destroyedTargetRemoveDelaySec = TARGET_LIFECYCLE_DEFAULTS.destroyedTargetRemoveDelaySec;
      state.losSectorColor = LOS_SECTOR_RESET_COLOR;
      state.categoryVisuals = {};
    },
  },
});

export const {
  setInactiveTargetTimeout,
  setDisconnectedTargetTimeout,
  setDestroyedTargetDelay,
  setLosSectorColor,
  setCategoryColor,
  setCategoryOpacity,
  initializeCategory,
  resetToDefaults,
} = settingsSlice.actions;

export default settingsSlice.reducer;
