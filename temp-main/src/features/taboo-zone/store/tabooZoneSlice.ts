import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type TabooZoneState = {
  radiusMeters: number;
  angles: string[] | null;
};

const initialState: TabooZoneState = {
  radiusMeters: 0,
  angles: null,
};

const slice = createSlice({
  name: 'tabooZone',
  initialState,
  reducers: {
    setTabooZoneSector(
      state,
      action: PayloadAction<{
        radiusMeters: number;
        minAngle: number | '';
        maxAngle: number | '';
      }>,
    ) {
      state.radiusMeters = action.payload.radiusMeters;
      state.angles = [
        `${action.payload.minAngle}-${action.payload.maxAngle}`,
      ];
    },
    clearTabooZoneSector(state) {
      state.angles = null;
    },
  },
});

export const { setTabooZoneSector, clearTabooZoneSector } = slice.actions;
export default slice.reducer;
