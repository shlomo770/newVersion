declare module '@hyvilo/maplibre-gl-draw' {
  import type { IControl, Map } from 'maplibre-gl';
  import type { GeoJSON } from 'geojson';
  import type { LayerSpecification } from 'maplibre-gl';

  export type DrawStyleLayer =
    | Omit<import('maplibre-gl').FillLayerSpecification, 'source'>
    | Omit<import('maplibre-gl').LineLayerSpecification, 'source'>
    | Omit<import('maplibre-gl').CircleLayerSpecification, 'source'>;

  interface MapLibreDrawOptions {
    displayControlsDefault?: boolean;
    controls?: {
      polygon?: boolean;
      line_string?: boolean;
      point?: boolean;
      trash?: boolean;
      combine_features?: boolean;
      uncombine_features?: boolean;
    };
    styles?: DrawStyleLayer[];
    modes?: Record<string, Record<string, unknown>>;
    defaultMode?: string;
  }

  class MapLibreDraw implements IControl {
    static modes: Record<string, Record<string, unknown>>;

    constructor(options?: MapLibreDrawOptions);

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

  export default MapLibreDraw;
}
