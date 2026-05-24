import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { EntityType } from '@domain/models/entity';

export type MapDrawingMode = EntityType | 'measure' | 'measure-area' | null;

export interface MapInteractionState {
  drawingMode: MapDrawingMode;
}

const initialState: MapInteractionState = {
  drawingMode: null,
};

const mapInteractionSlice = createSlice({
  name: 'mapInteraction',
  initialState,
  reducers: {
    setDrawingMode: (state, action: PayloadAction<MapDrawingMode>) => {
      state.drawingMode = action.payload;
    },
    clearDrawingMode: (state) => {
      state.drawingMode = null;
    },
  },
});

export const { setDrawingMode, clearDrawingMode } = mapInteractionSlice.actions;
export default mapInteractionSlice.reducer;
