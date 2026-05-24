import type { Map as MaplibreMap } from 'maplibre-gl';
import type { Feature, FeatureCollection, LineString, Point, Polygon } from 'geojson';
import type { Coordinates } from '@domain/models/coordinates';
import { closeRing } from '@/utils/geometry';
import { MEASURE_IDS, MEASURE_VISUALS } from '@features/map/config';
import { MapLayerManager } from './MapLayerManager';

const POINTS_PAINT = {
  'circle-radius': MEASURE_VISUALS.pointRadius,
  'circle-color': MEASURE_VISUALS.pointFill,
  'circle-stroke-color': MEASURE_VISUALS.pointStroke,
  'circle-stroke-width': MEASURE_VISUALS.pointStrokeWidth,
} as const;

const toCoord = (pt: Coordinates): [number, number] => [pt.lng, pt.lat];

export class MapMeasurementService {
  private map: MaplibreMap;
  private layerManager: MapLayerManager;

  constructor(map: MaplibreMap, layerManager: MapLayerManager) {
    this.map = map;
    this.layerManager = layerManager;
  }

  public renderMeasurement(points: Coordinates[]) {
    if (!this.map) return;

    this.layerManager.removeLayerAndSource(MEASURE_IDS.distanceLineLayer);
    this.layerManager.removeLayerAndSource(MEASURE_IDS.distancePointsLayer);

    if (points.length > 0) {
      const pointsData: FeatureCollection<Point> = {
        type: 'FeatureCollection',
        features: points.map((pt, index) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: toCoord(pt) },
          properties: { index },
        })),
      };
      this.map.addSource(MEASURE_IDS.distancePointsSource, {
        type: 'geojson',
        data: pointsData,
      });
      this.map.addLayer({
        id: MEASURE_IDS.distancePointsLayer,
        type: 'circle',
        source: MEASURE_IDS.distancePointsSource,
        paint: POINTS_PAINT,
      });
    }

    if (points.length >= 2) {
      const lineData: Feature<LineString> = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: points.map(toCoord),
        },
        properties: {},
      };
      this.map.addSource(MEASURE_IDS.distanceLineSource, {
        type: 'geojson',
        data: lineData,
      });
      this.map.addLayer({
        id: MEASURE_IDS.distanceLineLayer,
        type: 'line',
        source: MEASURE_IDS.distanceLineSource,
        paint: {
          'line-color': MEASURE_VISUALS.accentColor,
          'line-width': MEASURE_VISUALS.distanceLineWidth,
        },
      });
    }
  }

  public renderMeasurementPreview(start: Coordinates, current: Coordinates) {
    if (!this.map) return;

    const previewLine: Feature<LineString> = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [toCoord(start), toCoord(current)],
      },
      properties: {},
    };

    const sourceId = MEASURE_IDS.distancePreviewSource;
    const layerId = MEASURE_IDS.distancePreviewLayer;
    const source = this.map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(previewLine);
    } else {
      this.map.addSource(sourceId, {
        type: 'geojson',
        data: previewLine,
      });
      this.map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': MEASURE_VISUALS.accentColor,
          'line-width': MEASURE_VISUALS.previewLineWidth,
          'line-opacity': MEASURE_VISUALS.previewLineOpacity,
          'line-dasharray': MEASURE_VISUALS.previewLineDash,
        },
      });
    }
  }

  public clearMeasurementPreview() {
    this.layerManager.removeLayerAndSource(MEASURE_IDS.distancePreviewLayer);
  }

  public renderAreaMeasurement(points: Coordinates[]) {
    if (!this.map) return;

    this.layerManager.removeLayerAndSource(MEASURE_IDS.areaFillLayer);
    this.layerManager.removeLayerAndSource(MEASURE_IDS.areaLineLayer);
    this.layerManager.removeLayerAndSource(MEASURE_IDS.areaPointsLayer);

    if (points.length > 0) {
      const pointsData: FeatureCollection<Point> = {
        type: 'FeatureCollection',
        features: points.map((pt, index) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: toCoord(pt) },
          properties: { index },
        })),
      };
      this.map.addSource(MEASURE_IDS.areaPointsSource, {
        type: 'geojson',
        data: pointsData,
      });
      this.map.addLayer({
        id: MEASURE_IDS.areaPointsLayer,
        type: 'circle',
        source: MEASURE_IDS.areaPointsSource,
        paint: POINTS_PAINT,
      });
    }

    if (points.length >= 3) {
      const ring = closeRing(points);
      const lineData: Feature<LineString> = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: points.map(toCoord),
        },
        properties: {},
      };
      this.map.addSource(MEASURE_IDS.areaLineSource, {
        type: 'geojson',
        data: lineData,
      });
      this.map.addLayer({
        id: MEASURE_IDS.areaLineLayer,
        type: 'line',
        source: MEASURE_IDS.areaLineSource,
        paint: {
          'line-color': MEASURE_VISUALS.accentColor,
          'line-width': MEASURE_VISUALS.areaLineWidth,
        },
      });

      const fillData: Feature<Polygon> = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [ring.map(toCoord)],
        },
        properties: {},
      };
      this.map.addSource(MEASURE_IDS.areaFillSource, {
        type: 'geojson',
        data: fillData,
      });
      this.map.addLayer({
        id: MEASURE_IDS.areaFillLayer,
        type: 'fill',
        source: MEASURE_IDS.areaFillSource,
        paint: {
          'fill-color': MEASURE_VISUALS.accentColor,
          'fill-opacity': MEASURE_VISUALS.areaFillOpacity,
        },
      });
    }
  }

  public renderAreaMeasurementPreview(points: Coordinates[], current: Coordinates) {
    if (!this.map || points.length === 0) return;

    const previewPoints = [...points, current];
    const lineCoords = previewPoints.map(toCoord);

    const lineSourceId = MEASURE_IDS.areaPreviewLineSource;
    const lineLayerId = MEASURE_IDS.areaPreviewLineLayer;
    const lineSource = this.map.getSource(lineSourceId) as maplibregl.GeoJSONSource | undefined;
    const lineData: Feature<LineString> = {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: lineCoords },
      properties: {},
    };
    if (lineSource) {
      lineSource.setData(lineData);
    } else {
      this.map.addSource(lineSourceId, { type: 'geojson', data: lineData });
      this.map.addLayer({
        id: lineLayerId,
        type: 'line',
        source: lineSourceId,
        paint: {
          'line-color': MEASURE_VISUALS.accentColor,
          'line-width': MEASURE_VISUALS.previewLineWidth,
          'line-opacity': MEASURE_VISUALS.previewLineOpacity,
          'line-dasharray': MEASURE_VISUALS.previewLineDash,
        },
      });
    }

    if (previewPoints.length >= 3) {
      const ring = closeRing(previewPoints);
      const fillSourceId = MEASURE_IDS.areaPreviewFillSource;
      const fillLayerId = MEASURE_IDS.areaPreviewFillLayer;
      const fillSource = this.map.getSource(fillSourceId) as maplibregl.GeoJSONSource | undefined;
      const fillData: Feature<Polygon> = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [ring.map(toCoord)],
        },
        properties: {},
      };
      if (fillSource) {
        fillSource.setData(fillData);
      } else {
        this.map.addSource(fillSourceId, { type: 'geojson', data: fillData });
        this.map.addLayer({
          id: fillLayerId,
          type: 'fill',
          source: fillSourceId,
          paint: {
            'fill-color': MEASURE_VISUALS.accentColor,
            'fill-opacity': MEASURE_VISUALS.areaPreviewFillOpacity,
          },
        });
      }
    }
  }

  public clearAreaMeasurementPreview() {
    this.layerManager.removeLayerAndSource(MEASURE_IDS.areaPreviewLineLayer);
    this.layerManager.removeLayerAndSource(MEASURE_IDS.areaPreviewFillLayer);
  }

  public clearMeasurement() {
    this.clearMeasurementPreview();
    this.layerManager.removeLayerAndSource(MEASURE_IDS.distanceLineLayer);
    this.layerManager.removeLayerAndSource(MEASURE_IDS.distancePointsLayer);
  }

  public clearAreaMeasurement() {
    this.clearAreaMeasurementPreview();
    this.layerManager.removeLayerAndSource(MEASURE_IDS.areaFillLayer);
    this.layerManager.removeLayerAndSource(MEASURE_IDS.areaLineLayer);
    this.layerManager.removeLayerAndSource(MEASURE_IDS.areaPointsLayer);
  }
}
