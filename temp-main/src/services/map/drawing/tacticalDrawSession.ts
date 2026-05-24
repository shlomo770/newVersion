import type {
  Map as MaplibreMap,
  MapLayerMouseEvent,
  MapTouchEvent,
  MapGeoJSONFeature,
  MapMouseEvent,
} from 'maplibre-gl';
import type * as GeoJSON from 'geojson';
import type { MapServiceRuntime } from '../mapServiceRuntime';
import { createCirclePolygon, createEllipsePolygon, getEntityAnchor } from '@shared/lib/geo';
import type { Coordinates } from '@domain/models/coordinates';
import type { EntityDrawDraft, TacticalEntity } from '@domain/models/entity';
import { distanceToSegment } from '../Helpers';
import type { MapEntityRenderer } from '../MapEntityRenderer';
import {
  ensureGeoJsonSource,
  ensurePaintLayer,
  removeLayerAndSource,
  removeSourceBundles,
  safePreventMapEvent,
} from './drawOverlayLayers';
import type { MeasurementDrawHandler } from './measurementDrawHandler';
import { isTacticalDrawType } from './drawTypes';
import type { DrawingUiState, DrawSessionMode, TacticalDrawType } from './drawTypes';

const SHAPE_SOURCE_ID = 'draw-shape-source';
const SHAPE_FILL_LAYER_ID = 'draw-shape-fill';
const SHAPE_LINE_LAYER_ID = 'draw-shape-line';
const HANDLE_SOURCE_ID = 'draw-handles-source';
const HANDLE_LAYER_ID = 'draw-handles-layer';
const POLY_LINE_SOURCE_ID = 'draw-poly-line-source';
const POLY_LINE_LAYER_ID = 'draw-poly-line-layer';
const POLY_FILL_SOURCE_ID = 'draw-poly-fill-source';
const POLY_FILL_LAYER_ID = 'draw-poly-fill-layer';
const VERTEX_SOURCE_ID = 'draw-vertices-source';
const VERTEX_LAYER_ID = 'draw-vertices-layer';

type LayerPointerEvent =
  | MapLayerMouseEvent
  | (MapTouchEvent & { features?: MapGeoJSONFeature[] });

type DragState =
  | { type: 'none' }
  | { type: 'edge' }
  | {
      type: 'center';
      start: Coordinates;
      originPoints: Coordinates[];
    }
  | {
      type: 'vertex';
      index: number;
    };

export class TacticalDrawSession {
  private readonly map: MaplibreMap;
  private readonly entityRenderer: MapEntityRenderer;
  private readonly measurement: MeasurementDrawHandler;
  private readonly runtime: MapServiceRuntime;
  private onUiStateChanged?: (state: DrawingUiState | null) => void;

  private mode: DrawSessionMode = 'none';
  private activeType: TacticalDrawType | null = null;
  private activeEntityId: string | null = null;
  private activeEntitySnapshot: TacticalEntity | null = null;
  private points: Coordinates[] = [];
  private dragState: DragState = { type: 'none' };
  private layerHandlersBound = false;
  private globalHandlersBound = false;
  private mapListenersSuppressed = false;
  private markerHandler?: (payload: EntityDrawDraft) => void;

  constructor(
    map: MaplibreMap,
    entityRenderer: MapEntityRenderer,
    measurement: MeasurementDrawHandler,
    runtime: MapServiceRuntime,
  ) {
    this.map = map;
    this.entityRenderer = entityRenderer;
    this.measurement = measurement;
    this.runtime = runtime;
  }

  setUiListener(listener: (state: DrawingUiState | null) => void): void {
    this.onUiStateChanged = listener;
  }

  isActive(): boolean {
    return this.mode !== 'none' && this.activeType !== null;
  }

  getActiveType(): TacticalDrawType | null {
    return this.activeType;
  }

  getMode(): DrawSessionMode {
    return this.mode;
  }

  getPoints(): Coordinates[] {
    return this.points;
  }

  startCreate(type: TacticalDrawType): void {
    this.reset();
    this.mode = 'create';
    this.activeType = type;
    this.points = [];
    this.resumeMapListeners();
    this.updateUiState();
  }

  startEdit(entityId: string, entity: TacticalEntity): void {
    this.reset();
    if (!isTacticalDrawType(entity.type)) {
      return;
    }
    this.mode = 'edit';
    this.activeType = entity.type;
    this.activeEntityId = entityId;
    this.activeEntitySnapshot = { ...entity };

    if (this.activeType === 'polygon' || this.activeType === 'line') {
      const coords = [...entity.coordinates];
      if (coords.length > 1) {
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first.lng === last.lng && first.lat === last.lat) {
          coords.pop();
        }
      }
      this.points = coords;
    } else {
      const center = entity.coordinates[0];
      let edge = entity.coordinates[1];
      if (!edge || (edge.lng === center.lng && edge.lat === center.lat)) {
        edge = { lng: center.lng + 0.001, lat: center.lat + 0.001 };
      }
      this.points = [center, edge];
    }

    this.entityRenderer.removeEntityFromMap(entityId);
    this.refreshOverlays();
    this.resumeMapListeners();
    this.updateUiState();
  }

  canFinish(): boolean {
    if (!this.activeType) return false;
    if (this.activeType === 'marker') return this.points.length >= 1;
    if (this.activeType === 'polygon') return this.points.length >= 3;
    if (this.points.length < 2) return false;
    const [c, e] = this.points;
    return !(c.lng === e.lng && c.lat === e.lat);
  }

  getFinalPoints(): Coordinates[] {
    const clean = this.getCleanPoints();
    if (this.activeType !== 'polygon') {
      return clean;
    }
    if (clean.length < 3) {
      return clean;
    }
    const first = clean[0];
    const last = clean[clean.length - 1];
    if (first.lng === last.lng && first.lat === last.lat) {
      return clean;
    }
    return [...clean, { ...first }];
  }

  finish(
    onEntityDrawn: (entity: EntityDrawDraft) => void,
    onEntityUpdated: (id: string, coordinates: Coordinates[]) => void,
  ): void {
    if (this.mode === 'none' || !this.activeType || !this.canFinish()) {
      return;
    }

    if (this.mode === 'create') {
      const coords = this.getFinalPoints();
      if (this.activeType === 'marker') {
        onEntityDrawn({ type: 'marker', coordinates: coords, properties: {} });
      } else if (this.activeType === 'line') {
        onEntityDrawn({ type: 'line', coordinates: coords });
      } else {
        onEntityDrawn({ type: this.activeType, coordinates: coords });
      }
      this.reset();
      return;
    }

    if (this.mode === 'edit' && this.activeEntityId && this.activeEntitySnapshot) {
      const coords = this.getFinalPoints();
      onEntityUpdated(this.activeEntityId, coords);
      const snapshot = { ...this.activeEntitySnapshot };
      this.entityRenderer.addEntityToMap({
        ...snapshot,
        id: this.activeEntityId,
        coordinates: coords,
      });
      this.reset();
    }
  }

  reset(): void {
    this.clearOverlays();
    this.pauseMapListeners();
    this.enableMapInteractions();
    this.mode = 'none';
    this.activeType = null;
    this.activeEntityId = null;
    this.activeEntitySnapshot = null;
    this.points = [];
    this.dragState = { type: 'none' };
    this.measurement.clear();
    this.updateUiState();
  }

  registerMarkerHandler(handler: (entity: EntityDrawDraft) => void): void {
    this.markerHandler = handler;
  }

  /**
   * Suspend tactical map listeners while MapLibre Draw owns pointer events.
   */
  pauseMapListeners(): void {
    this.mapListenersSuppressed = true;
    this.unbindGlobalHandlers();
    this.unbindLayerHandlers();
  }

  /**
   * Restore tactical listeners when draw library releases and session is still active.
   */
  resumeMapListeners(): void {
    this.mapListenersSuppressed = false;
    if (!this.isActive()) return;
    this.bindGlobalHandlers();
    this.bindLayerHandlers();
  }

  bindGlobalHandlers(): void {
    if (this.globalHandlersBound || this.mapListenersSuppressed) return;
    this.map.on('click', this.handleMapClickBound);
    this.map.on('mousedown', this.handleMapDown);
    this.map.on('touchstart', this.handleMapDown);
    this.map.on('mousemove', this.handleMapMove);
    this.map.on('touchmove', this.handleMapMove);
    this.map.on('mouseup', this.handleMapUp);
    this.map.on('touchend', this.handleMapUp);
    this.map.on('touchcancel', this.handleMapUp);
    this.map.on('mouseout', this.handleMapUp);
    this.globalHandlersBound = true;
  }

  unbindGlobalHandlers(): void {
    if (!this.globalHandlersBound) return;
    this.map.off('click', this.handleMapClickBound);
    this.map.off('mousedown', this.handleMapDown);
    this.map.off('touchstart', this.handleMapDown);
    this.map.off('mousemove', this.handleMapMove);
    this.map.off('touchmove', this.handleMapMove);
    this.map.off('mouseup', this.handleMapUp);
    this.map.off('touchend', this.handleMapUp);
    this.map.off('touchcancel', this.handleMapUp);
    this.map.off('mouseout', this.handleMapUp);
    this.globalHandlersBound = false;
  }

  private handleMapClickBound = (e: MapMouseEvent): void => {
    if (this.mode !== 'create' || !this.activeType) return;
    if (this.dragState.type !== 'none') return;

    if (this.activeType === 'marker') {
      const point = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      const iconCode = this.runtime.getSelectedMarkerIcon();
      this.markerHandler?.({
        type: 'marker',
        coordinates: [point],
        properties: { iconChar: iconCode },
      });
      this.reset();
      return;
    }

    if (this.activeType === 'polygon' || this.activeType === 'line') {
      this.points.push({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      this.refreshOverlays();
      this.updateUiState();
      return;
    }

    if (this.points.length === 0) {
      const center = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      this.points = [center, center];
    } else {
      this.points[1] = { lng: e.lngLat.lng, lat: e.lngLat.lat };
    }
    this.refreshOverlays();
    this.updateUiState();
  };

  private handleMapDown = (_e: MapMouseEvent): void => {
    if (this.mode !== 'create') return;
  };

  private handleMapMove = (e: MapMouseEvent): void => {
    if (this.dragState.type === 'none') return;
    if (!this.activeType) return;

    if (this.dragState.type === 'edge' && (this.activeType === 'circle' || this.activeType === 'ellipse')) {
      this.points[1] = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      this.refreshOverlays();
      this.updateUiState();
      return;
    }

    if (this.dragState.type === 'center' && this.dragState.start && this.dragState.originPoints) {
      const dx = e.lngLat.lng - this.dragState.start.lng;
      const dy = e.lngLat.lat - this.dragState.start.lat;
      this.points = this.dragState.originPoints.map((p) => ({
        lng: p.lng + dx,
        lat: p.lat + dy,
      }));
      this.refreshOverlays();
      this.updateUiState();
      return;
    }

    if (this.dragState.type === 'vertex') {
      this.points[this.dragState.index] = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      this.refreshOverlays();
      this.updateUiState();
    }
  };

  private handleMapUp = (): void => {
    this.dragState = { type: 'none' };
    this.enableMapInteractions();
  };

  private handleHandleDown = (e: LayerPointerEvent): void => {
    if (this.mode === 'none' || !this.activeType) return;
    if (!e.features?.length) return;
    const feature = e.features[0];
    const role = feature.properties?.role;
    if (role !== 'center' && role !== 'edge') return;

    safePreventMapEvent(e);
    e.originalEvent?.stopPropagation?.();

    if (role === 'edge') {
      this.dragState = { type: 'edge' };
    } else {
      this.dragState = {
        type: 'center',
        start: { lng: e.lngLat.lng, lat: e.lngLat.lat },
        originPoints: [...this.points],
      };
    }
    this.disableMapInteractions();
  };

  private handleVertexDown = (e: LayerPointerEvent): void => {
    if (this.mode === 'none' || (this.activeType !== 'polygon' && this.activeType !== 'line')) return;
    if (!e.features?.length) return;
    const feature = e.features[0];
    const indexRaw = feature.properties?.index;
    const index = typeof indexRaw === 'number' ? indexRaw : Number(indexRaw);
    if (!Number.isFinite(index)) return;

    safePreventMapEvent(e);
    e.originalEvent?.stopPropagation?.();
    this.dragState = { type: 'vertex', index };
    this.disableMapInteractions();
  };

  private handlePolyLineClick = (e: MapLayerMouseEvent): void => {
    if (this.mode !== 'edit' || (this.activeType !== 'polygon' && this.activeType !== 'line')) return;
    if (this.dragState.type !== 'none') return;

    const clickPoint = { lng: e.lngLat.lng, lat: e.lngLat.lat };
    if (this.points.length < 2) return;

    let insertIndex = -1;
    let minDist = Infinity;

    for (let i = 0; i < this.points.length - 1; i++) {
      const dist = distanceToSegment(clickPoint, this.points[i], this.points[i + 1]);
      if (dist < minDist) {
        minDist = dist;
        insertIndex = i + 1;
      }
    }

    if (this.activeType === 'polygon') {
      const endDist = distanceToSegment(
        clickPoint,
        this.points[this.points.length - 1],
        this.points[0],
      );
      if (endDist < minDist) {
        insertIndex = this.points.length;
      }
    }

    if (insertIndex >= 0) {
      this.points.splice(insertIndex, 0, clickPoint);
      this.refreshOverlays();
      this.updateUiState();
    }
  };

  bindLayerHandlers(): void {
    if (this.layerHandlersBound || this.mapListenersSuppressed) return;
    if (this.map.getLayer(HANDLE_LAYER_ID)) {
      this.map.on('mousedown', HANDLE_LAYER_ID, this.handleHandleDown);
      this.map.on('touchstart', HANDLE_LAYER_ID, this.handleHandleDown);
    }
    if (this.map.getLayer(VERTEX_LAYER_ID)) {
      this.map.on('mousedown', VERTEX_LAYER_ID, this.handleVertexDown);
      this.map.on('touchstart', VERTEX_LAYER_ID, this.handleVertexDown);
    }
    if (this.map.getLayer(POLY_LINE_LAYER_ID)) {
      this.map.on('click', POLY_LINE_LAYER_ID, this.handlePolyLineClick);
    }
    this.layerHandlersBound = true;
  }

  unbindLayerHandlers(): void {
    if (!this.layerHandlersBound) return;
    this.map.off('mousedown', HANDLE_LAYER_ID, this.handleHandleDown);
    this.map.off('touchstart', HANDLE_LAYER_ID, this.handleHandleDown);
    this.map.off('mousedown', VERTEX_LAYER_ID, this.handleVertexDown);
    this.map.off('touchstart', VERTEX_LAYER_ID, this.handleVertexDown);
    this.map.off('click', POLY_LINE_LAYER_ID, this.handlePolyLineClick);
    this.layerHandlersBound = false;
  }

  private refreshOverlays(): void {
    if (this.activeType === 'circle' || this.activeType === 'ellipse') {
      this.updateCircleEllipsePreview();
    } else if (this.activeType === 'polygon' || this.activeType === 'line') {
      this.updatePolygonPreview();
    }
    this.bindLayerHandlers();
  }

  private updateCircleEllipsePreview(): void {
    if (this.points.length === 0) return;
    const center = this.points[0];
    const edge = this.points[1] || { lng: center.lng + 0.001, lat: center.lat + 0.001 };
    const polygon =
      this.activeType === 'circle'
        ? createCirclePolygon(center, edge, 64)
        : createEllipsePolygon(center, edge, 64);

    const geojson: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [polygon.map((pt) => [pt.lng, pt.lat])],
      },
      properties: {},
    };

    ensureGeoJsonSource(this.map, SHAPE_SOURCE_ID, geojson);
    ensurePaintLayer(this.map, SHAPE_FILL_LAYER_ID, 'fill', SHAPE_SOURCE_ID, {
      'fill-color': '#3b82f6',
      'fill-opacity': 0.25,
      'fill-outline-color': '#1e40af',
    });
    ensurePaintLayer(this.map, SHAPE_LINE_LAYER_ID, 'line', SHAPE_SOURCE_ID, {
      'line-color': '#1e40af',
      'line-width': 2,
    });

    const handlesGeojson: GeoJSON.FeatureCollection<GeoJSON.Point, { role: string }> = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [center.lng, center.lat] },
          properties: { role: 'center' },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [edge.lng, edge.lat] },
          properties: { role: 'edge' },
        },
      ],
    };
    ensureGeoJsonSource(this.map, HANDLE_SOURCE_ID, handlesGeojson);
    ensurePaintLayer(this.map, HANDLE_LAYER_ID, 'circle', HANDLE_SOURCE_ID, {
      'circle-radius': 6,
      'circle-color': [
        'case',
        ['==', ['get', 'role'], 'center'],
        '#1e40af',
        '#3b82f6',
      ],
      'circle-stroke-color': '#fff',
      'circle-stroke-width': 2,
    });

    this.measurement.updateLiveMeasurement(center, edge);
  }

  private updatePolygonPreview(): void {
    const coords = this.points.map((pt) => [pt.lng, pt.lat]);

    if (coords.length >= 2) {
      const lineGeojson: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
        properties: {},
      };
      ensureGeoJsonSource(this.map, POLY_LINE_SOURCE_ID, lineGeojson);
      ensurePaintLayer(this.map, POLY_LINE_LAYER_ID, 'line', POLY_LINE_SOURCE_ID, {
        'line-color': '#1e40af',
        'line-width': 2,
      });
    } else {
      removeLayerAndSource(this.map, POLY_LINE_LAYER_ID, POLY_LINE_SOURCE_ID);
    }

    if (this.activeType === 'polygon' && coords.length >= 3) {
      const polyGeojson: GeoJSON.Feature<GeoJSON.Polygon> = {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [[...coords, coords[0]]] },
        properties: {},
      };
      ensureGeoJsonSource(this.map, POLY_FILL_SOURCE_ID, polyGeojson);
      ensurePaintLayer(this.map, POLY_FILL_LAYER_ID, 'fill', POLY_FILL_SOURCE_ID, {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.25,
      });
    } else {
      removeLayerAndSource(this.map, POLY_FILL_LAYER_ID, POLY_FILL_SOURCE_ID);
    }

    if (coords.length > 0) {
      const verticesGeojson: GeoJSON.FeatureCollection<GeoJSON.Point, { index: number }> = {
        type: 'FeatureCollection',
        features: this.points.map((pt, index) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [pt.lng, pt.lat] },
          properties: { index },
        })),
      };
      ensureGeoJsonSource(this.map, VERTEX_SOURCE_ID, verticesGeojson);
      ensurePaintLayer(this.map, VERTEX_LAYER_ID, 'circle', VERTEX_SOURCE_ID, {
        'circle-radius': 6,
        'circle-color': '#3b82f6',
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 2,
      });
    } else {
      removeLayerAndSource(this.map, VERTEX_LAYER_ID, VERTEX_SOURCE_ID);
    }

    this.measurement.clear();
  }

  private clearOverlays(): void {
    this.unbindLayerHandlers();
    removeSourceBundles(this.map, [
      {
        sourceId: SHAPE_SOURCE_ID,
        layerIds: [SHAPE_FILL_LAYER_ID, SHAPE_LINE_LAYER_ID],
      },
      { sourceId: HANDLE_SOURCE_ID, layerIds: [HANDLE_LAYER_ID] },
      { sourceId: POLY_LINE_SOURCE_ID, layerIds: [POLY_LINE_LAYER_ID] },
      { sourceId: POLY_FILL_SOURCE_ID, layerIds: [POLY_FILL_LAYER_ID] },
      { sourceId: VERTEX_SOURCE_ID, layerIds: [VERTEX_LAYER_ID] },
    ]);
    this.measurement.clear();
  }

  private getCleanPoints(): Coordinates[] {
    if (this.activeType !== 'polygon') return this.points;
    if (this.points.length === 0) return [];
    const first = this.points[0];
    const last = this.points[this.points.length - 1];
    if (first.lng === last.lng && first.lat === last.lat) {
      return this.points.slice(0, -1);
    }
    return this.points;
  }

  private updateUiState(): void {
    if (this.mode === 'none' || !this.activeType) {
      this.onUiStateChanged?.(null);
      return;
    }
    const coords = this.getCleanPoints();
    if (coords.length === 0) {
      this.onUiStateChanged?.(null);
      return;
    }
    const anchor = getEntityAnchor({ type: this.activeType, coordinates: coords });
    this.onUiStateChanged?.({
      mode: this.mode,
      type: this.activeType,
      anchor,
      entityId: this.activeEntityId ?? undefined,
      canFinish: this.canFinish(),
    });
  }

  private disableMapInteractions(): void {
    this.map.dragPan.disable();
    this.map.touchZoomRotate.disable();
    this.map.scrollZoom.disable();
    this.map.doubleClickZoom.disable();
  }

  private enableMapInteractions(): void {
    this.map.dragPan.enable();
    this.map.touchZoomRotate.enable();
    this.map.scrollZoom.enable();
    this.map.doubleClickZoom.enable();
  }

  destroy(): void {
    this.reset();
    this.pauseMapListeners();
    this.onUiStateChanged = undefined;
  }
}
