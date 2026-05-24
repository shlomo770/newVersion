import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { MapState, Coordinates } from '@domain/models';
import {
  BRIGHTNESS_CONFIG,
  DEFAULT_BASEMAP_ID,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ROTATION,
  DEFAULT_MAP_ZOOM,
  RESET_BASEMAP_ID,
  RESET_MAP_CENTER,
  RESET_MAP_ZOOM,
} from '../config/mapDefaults.config';

const initialState: MapState = {
  rotation: DEFAULT_MAP_ROTATION,
  brightness: BRIGHTNESS_CONFIG.initial,
  center: DEFAULT_MAP_CENTER,
  zoom: DEFAULT_MAP_ZOOM,
  selectedMapType: DEFAULT_BASEMAP_ID,
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setRotation: (state, action: PayloadAction<number>) => {
      state.rotation = action.payload;
    },

    setBrightness: (state, action: PayloadAction<number>) => {
      state.brightness = Math.max(0, Math.min(BRIGHTNESS_CONFIG.clampMax, action.payload));
    },

    setCenter: (state, action: PayloadAction<Coordinates>) => {
      state.center = action.payload;
    },

    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = action.payload;
    },

    setMapType: (state, action: PayloadAction<string>) => {
      state.selectedMapType = action.payload;
    },

    resetMap: (state) => {
      state.rotation = DEFAULT_MAP_ROTATION;
      state.brightness = BRIGHTNESS_CONFIG.resetValue;
      state.center = RESET_MAP_CENTER;
      state.zoom = RESET_MAP_ZOOM;
      state.selectedMapType = RESET_BASEMAP_ID;
    },
  },
});

export const {
  setRotation,
  setBrightness,
  setCenter,
  setZoom,
  setMapType,
  resetMap,
} = mapSlice.actions;

export default mapSlice.reducer;
