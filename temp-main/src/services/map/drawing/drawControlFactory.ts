import MapLibreDraw from '@hyvilo/maplibre-gl-draw';
import { buildCustomDrawModes } from './customTacticalModes';
import { MAPLIBRE_DRAW_STYLES } from './maplibreDrawStyles';

export type MapDrawControl = MapLibreDraw;

export function createMapDrawControl(): MapDrawControl {
  const defaultModes = MapLibreDraw.modes as Record<string, Record<string, unknown>>;
  return new MapLibreDraw({
    displayControlsDefault: false,
    controls: {
      polygon: false,
      line_string: false,
      point: false,
      trash: false,
      combine_features: false,
      uncombine_features: false,
    },
    styles: MAPLIBRE_DRAW_STYLES,
    modes: buildCustomDrawModes(defaultModes),
  });
}

export function attachDrawControl(map: maplibregl.Map, draw: MapDrawControl): void {
  map.addControl(draw, 'top-left');
}

export function detachDrawControl(map: maplibregl.Map, draw: MapDrawControl): void {
  try {
    map.removeControl(draw);
  } catch {
    /* control may already be detached during style swap */
  }
}
