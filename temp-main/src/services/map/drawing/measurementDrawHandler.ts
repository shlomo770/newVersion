import type { Map as MaplibreMap, GeoJSONSource } from 'maplibre-gl';
import type { Feature, Point } from 'geojson';
import {
  bearingDegrees,
  calculateDistance,
  formatDistance,
} from '@shared/lib/geo';
import type { Coordinates } from '@domain/models/coordinates';
import { removeSourceBundle } from './drawOverlayLayers';

const MEASURE_SOURCE_ID = 'draw-measure-label-source';
const MEASURE_LAYER_ID = 'draw-measure-label-layer';

export class MeasurementDrawHandler {
  private readonly map: MaplibreMap;

  constructor(map: MaplibreMap) {
    this.map = map;
  }

  updateLiveMeasurement(center: Coordinates | null, edge: Coordinates | null): void {
    if (!center || !edge) {
      this.clear();
      return;
    }

    const distanceMeters = calculateDistance(center, edge);
    const bearing = bearingDegrees(center, edge);
    const midpoint: [number, number] = [
      (center.lng + edge.lng) / 2,
      (center.lat + edge.lat) / 2,
    ];

    const label = `${formatDistance(distanceMeters)} · ${bearing.toFixed(1)}°`;
    const feature: Feature<Point, { label: string }> = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: midpoint },
      properties: { label },
    };

    const existing = this.map.getSource(MEASURE_SOURCE_ID) as GeoJSONSource | undefined;
    if (existing) {
      existing.setData(feature);
      return;
    }

    this.map.addSource(MEASURE_SOURCE_ID, { type: 'geojson', data: feature });
    this.map.addLayer({
      id: MEASURE_LAYER_ID,
      type: 'symbol',
      source: MEASURE_SOURCE_ID,
      layout: {
        'text-field': ['get', 'label'],
        'text-font': ['Open Sans Semibold'],
        'text-size': 13,
        'text-anchor': 'center',
        'text-offset': [0, -1.2],
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#1e3a8a',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2,
      },
    });
  }

  clear(): void {
    removeSourceBundle(this.map, {
      sourceId: MEASURE_SOURCE_ID,
      layerIds: [MEASURE_LAYER_ID],
    });
  }
}
