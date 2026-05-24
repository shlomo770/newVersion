import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { COORDINATES_DEFAULTS } from '../config/mapDefaults.config';

interface CoordinatesState {
  isUTM: boolean;
  utmZone: number;
}

const initialState: CoordinatesState = {
  isUTM: COORDINATES_DEFAULTS.isUTM,
  utmZone: COORDINATES_DEFAULTS.utmZone,
};

const coordinatesSlice = createSlice({
  name: 'coordinates',
  initialState,
  reducers: {
    toggleCoordinateSystem: (state) => {
      state.isUTM = !state.isUTM;
    },
    setCoordinateSystem: (state, action: PayloadAction<boolean>) => {
      state.isUTM = action.payload;
    },
    setUTMZone: (state, action: PayloadAction<number>) => {
      state.utmZone = action.payload;
    },
  },
});

export const { toggleCoordinateSystem, setCoordinateSystem, setUTMZone } = coordinatesSlice.actions;
export default coordinatesSlice.reducer;
