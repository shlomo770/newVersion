import type { Coordinates } from '@domain/models/coordinates';

export type MapDrawType = 'circle' | 'ellipse' | 'polygon' | 'marker' | 'line';

export interface MapDrawingUiState {
  mode: 'create' | 'edit';
  type: MapDrawType;
  anchor: Coordinates;
  entityId?: string;
  canFinish: boolean;
}
