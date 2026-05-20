declare module '@mapbox/mapbox-gl-draw' {
  import type { Map } from 'maplibre-gl';
  import type { GeoJSON } from 'geojson';

  interface MapboxDrawOptions {
    displayControlsDefault?: boolean;
    controls?: {
      polygon?: boolean;
      line_string?: boolean;
      point?: boolean;
      trash?: boolean;
      combine_features?: boolean;
      uncombine_features?: boolean;
    };
    styles?: Record<string, unknown>[];
    modes?: Record<string, Record<string, unknown>>;
  }

  class MapboxDraw {
    static modes: Record<string, Record<string, unknown>>;

    constructor(options?: MapboxDrawOptions);

    modes: Record<string, Record<string, unknown>>;
    changeMode(mode: string, options?: Record<string, unknown>): void;
    delete(id: string): void;
    deleteAll(): void;
    get(id: string): GeoJSON.Feature | undefined;
    getAll(): GeoJSON.FeatureCollection;
    add(geojson: GeoJSON.Feature | GeoJSON.FeatureCollection): string[];
    removeControl(): void;
    onAdd(map: Map): HTMLElement;
    onRemove(map: Map): void;
  }

  export = MapboxDraw;
}
