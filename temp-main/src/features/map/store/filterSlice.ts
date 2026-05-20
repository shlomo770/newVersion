import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FilterState {
  targets: {
    all: boolean;
    friendly: boolean;
    hostile: boolean;
    unknown: boolean;
  };
  categories: {
    'No-fly zone': boolean;
    'Allowed zone': boolean;
    'Building': boolean;
    'Station': boolean;
    'Parking': boolean;
    'Other': boolean;
  };
  isFilterPanelOpen: boolean;
}

const initialState: FilterState = {
  targets: {
    all: true,
    friendly: true,
    hostile: true,
    unknown: true
  },
  categories: {
    'No-fly zone': true,
    'Allowed zone': true,
    'Building': true,
    'Station': true,
    'Parking': true,
    'Other': true
  },
  isFilterPanelOpen: false
};

const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    toggleLayer: (
      state,
      action: PayloadAction<{
        category: keyof Omit<FilterState, 'isFilterPanelOpen'>;
        layer: string;
      }>,
    ) => {
      const { category, layer } = action.payload;
      const bucket = state[category] as Record<string, boolean>;
      if (layer in bucket) {
        bucket[layer] = !bucket[layer];
      }
    },

    setLayerVisibility: (
      state,
      action: PayloadAction<{
        category: keyof Omit<FilterState, 'isFilterPanelOpen'>;
        layer: string;
        visible: boolean;
      }>,
    ) => {
      const { category, layer, visible } = action.payload;
      const bucket = state[category] as Record<string, boolean>;
      if (layer in bucket) {
        bucket[layer] = visible;
      }
    },
    
    resetFilters: (state) => {
      state.targets = initialState.targets;
      state.categories = initialState.categories;
    },
    
    setFilterPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.isFilterPanelOpen = action.payload;
    },
    
    // Quick filter presets
    showTargetsOnly: (state) => {
      // Only affect targets - keep all categories visible
      state.targets = { all: true, friendly: true, hostile: true, unknown: true };
    }
  }
});

export const {
  toggleLayer,
  setLayerVisibility,
  resetFilters,
  setFilterPanelOpen,
  showTargetsOnly
} = filterSlice.actions;

export default filterSlice.reducer; 