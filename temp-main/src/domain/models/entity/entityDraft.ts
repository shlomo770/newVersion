import type { Coordinates } from '../coordinates';
import type { DrawableEntityType } from './entityBase';
import type {
  AreaEntityProperties,
  LineEntityProperties,
  MarkerEntityProperties,
} from './entityVariants';

/** Payload produced by map drawing before an id is assigned. */
export type EntityDrawDraft =
  | {
      type: 'marker';
      coordinates: Coordinates[];
      properties: MarkerEntityProperties;
    }
  | {
      type: 'line';
      coordinates: Coordinates[];
      properties?: LineEntityProperties;
    }
  | {
      type: 'polygon' | 'rectangle' | 'circle' | 'ellipse' | 'sector';
      coordinates: Coordinates[];
      properties?: AreaEntityProperties;
    };

export function isEntityDrawDraftType(type: DrawableEntityType): type is EntityDrawDraft['type'] {
  return (
    type === 'marker' ||
    type === 'line' ||
    type === 'polygon' ||
    type === 'rectangle' ||
    type === 'circle' ||
    type === 'ellipse' ||
    type === 'sector'
  );
}
