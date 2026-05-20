import type { Coordinates } from '@domain/models/coordinates';
import type { EntityDrawDraft, EntityType } from '@domain/models/entity';

export type TacticalDrawType = 'circle' | 'ellipse' | 'polygon' | 'marker' | 'line';

export type DrawSessionMode = 'none' | 'create' | 'edit';

export interface DrawingCallbacks {
  onEntityDrawn: (entity: EntityDrawDraft) => void;
  onEntityUpdated: (id: string, coordinates: Coordinates[]) => void;
  onEntityDeleted: (id: string) => void;
}

export interface DrawingUiState {
  mode: 'create' | 'edit';
  type: TacticalDrawType;
  anchor: Coordinates;
  entityId?: string;
  canFinish: boolean;
}

export type DrawLibraryMode =
  | 'simple_select'
  | 'direct_select'
  | 'draw_polygon'
  | 'draw_line_string'
  | 'draw_point'
  | 'draw_circle'
  | 'draw_ellipse'
  | 'draw_rectangle';

export function isTacticalDrawType(type: EntityType): type is TacticalDrawType {
  return (
    type === 'circle' ||
    type === 'ellipse' ||
    type === 'polygon' ||
    type === 'marker' ||
    type === 'line'
  );
}

export function isDrawLibraryType(type: TacticalDrawType): boolean {
  return type === 'polygon' || type === 'line';
}

export function entityTypeToDrawMode(type: TacticalDrawType): DrawLibraryMode {
  switch (type) {
    case 'polygon':
      return 'draw_polygon';
    case 'line':
      return 'draw_line_string';
    case 'marker':
      return 'draw_point';
    case 'circle':
      return 'draw_circle';
    case 'ellipse':
      return 'draw_ellipse';
    default:
      return 'simple_select';
  }
}
