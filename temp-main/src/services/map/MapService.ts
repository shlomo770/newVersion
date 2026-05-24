import maplibregl from "maplibre-gl";
import type { EntityDrawDraft, EntityType, TacticalEntity } from '@domain/models/entity';
import type { Coordinates } from '@domain/models/coordinates';
import { getMapStyle } from '@/utils/mapStyle';
import { MapLayerManager } from "./MapLayerManager";
import { MapEntityRenderer } from "./MapEntityRenderer";
import { MapDrawingService, type DrawingUiState } from "./MapDrawingService";
import { MapMeasurementService } from "./MapMeasurementService";
import { MapStyleService } from "./MapStyleService";
import type { MapLayerEntity } from './entity-manager/entityManagerTypes';
import { attachMapErrorHandlers } from './mapErrorHandler';
import {
  emptyMapServiceRuntime,
  type MapServiceRuntime,
} from './mapServiceRuntime';

export class MapService {
  private map: maplibregl.Map | null = null;
  private detachMapErrorHandlers: (() => void) | null = null;
  private layerManager: MapLayerManager | null = null;
  private entityRenderer: MapEntityRenderer | null = null;
  private drawingService: MapDrawingService | null = null;
  private measurementService: MapMeasurementService | null = null;
  private styleService: MapStyleService | null = null;
  private readonly runtime: MapServiceRuntime;

  constructor(runtime: MapServiceRuntime = emptyMapServiceRuntime) {
    this.runtime = runtime;
  }

  public onEntityDrawn?: (entity: EntityDrawDraft) => void;
  public onEntityUpdated?: (id: string, coordinates: Coordinates[]) => void;
  public onEntityDeleted?: (id: string) => void;

  public getMap(): maplibregl.Map | null { return this.map; }
  public getCurrentMapType(): string { return this.styleService?.getCurrentMapType() || "vector-global"; }

  public initialize(
    container: string | HTMLElement,
    onEntityDrawn: (entity: EntityDrawDraft) => void,
    onEntityUpdated: (id: string, coordinates: Coordinates[]) => void,
    onEntityDeleted: (id: string) => void,
    initialMapType: string = "osm",
    initialCenter: { lng: number; lat: number } = { lng: 34.784, lat: 32.055 },
    initialZoom: number = 5
  ) {
    this.onEntityDrawn = onEntityDrawn;
    this.onEntityUpdated = onEntityUpdated;
    this.onEntityDeleted = onEntityDeleted;

    this.map = new maplibregl.Map({
      container,
      pitchWithRotate: false,
      maxPitch: 0,
      style: getMapStyle(initialMapType, "raster"),
      center: [initialCenter.lng, initialCenter.lat],
      zoom: initialZoom,
      interactive: true,
      touchZoomRotate: true,
      touchPitch: true,
      dragRotate: true,
      dragPan: true,
      scrollZoom: true,
      boxZoom: true,
      doubleClickZoom: false
    });

    this.detachMapErrorHandlers = attachMapErrorHandlers(this.map);

    const scaleControl = new maplibregl.ScaleControl({
      maxWidth: 150,
      unit: "metric"
    });
    this.map.addControl(scaleControl, "bottom-left");

    this.layerManager = new MapLayerManager(this.map, this.runtime);
    this.entityRenderer = new MapEntityRenderer(this.map, this.runtime);
    this.drawingService = new MapDrawingService(this.map, this.entityRenderer, this.runtime);
    this.measurementService = new MapMeasurementService(this.map, this.layerManager);
    this.styleService = new MapStyleService(this.map, this.drawingService, this.entityRenderer, this.runtime);
    this.styleService.setInitialMapType(initialMapType);

    this.drawingService.initialize({
      onEntityDrawn,
      onEntityUpdated,
      onEntityDeleted
    });

    this.map.doubleClickZoom.disable();
  }

  public setDrawingCallbacks(
    onEntityDrawn: (entity: EntityDrawDraft) => void,
    onEntityUpdated: (id: string, coordinates: Coordinates[]) => void,
    onEntityDeleted: (id: string) => void
  ) {
    this.onEntityDrawn = onEntityDrawn;
    this.onEntityUpdated = onEntityUpdated;
    this.onEntityDeleted = onEntityDeleted;
    this.drawingService?.setCallbacks({
      onEntityDrawn,
      onEntityUpdated,
      onEntityDeleted
    });
  }

  public setDrawingUiListener(listener: (state: DrawingUiState | null) => void) {
    this.drawingService?.setUiListener(listener);
  }

  public onStyleChanged(callback: () => void) {
    this.styleService?.onStyleChanged(callback);
  }

  public changeMapStylePreservingEntities(newStyle: maplibregl.StyleSpecification | string) {
    this.styleService?.changeMapStylePreservingEntities(newStyle);
  }

  public registerFinishEdit(fn: () => void) {
    this.drawingService?.registerFinishEdit(fn);
  }

  public triggerFinishEdit() {
    this.drawingService?.triggerFinishEdit();
  }

  public clearAllEntitiesFromMap() {
    this.entityRenderer?.clearAllEntitiesFromMap();
  }

  public reloadAllEntities() {
    this.entityRenderer?.reloadAllEntities();
  }

  public setDrawingMode(mode: EntityType | null) {
    this.drawingService?.setDrawingMode(mode);
  }

  public removeCirclePreview() {
    this.drawingService?.removeCirclePreview();
  }

  public removeEllipsePreview() {
    this.drawingService?.removeEllipsePreview();
  }

  public removeSectorPreview() {
    this.drawingService?.removeSectorPreview();
  }

  public removePolygonPreview() {
    this.drawingService?.removePolygonPreview();
  }

  public removeLastDrawPreview() {
    this.drawingService?.removeLastDrawPreview();
  }

  public finishEdit() {
    this.drawingService?.finishEdit();
  }

  public setEditMode(entityId: string, entity?: MapLayerEntity) {
    this.drawingService?.setEditMode(entityId, entity);
  }

  public renderMeasurement(points: Coordinates[]) {
    this.measurementService?.renderMeasurement(points);
  }

  public renderMeasurementPreview(start: Coordinates, current: Coordinates) {
    this.measurementService?.renderMeasurementPreview(start, current);
  }

  public clearMeasurementPreview() {
    this.measurementService?.clearMeasurementPreview();
  }

  public clearMeasurement() {
    this.measurementService?.clearMeasurement();
  }

  public renderAreaMeasurement(points: Coordinates[]) {
    this.measurementService?.renderAreaMeasurement(points);
  }

  public renderAreaMeasurementPreview(points: Coordinates[], current: Coordinates) {
    this.measurementService?.renderAreaMeasurementPreview(points, current);
  }

  public clearAreaMeasurementPreview() {
    this.measurementService?.clearAreaMeasurementPreview();
  }

  public clearAreaMeasurement() {
    this.measurementService?.clearAreaMeasurement();
  }

  public setRotation(rotation: number) {
    this.styleService?.setRotation(rotation);
  }

  public setBrightness(brightness: number) {
    this.styleService?.setBrightness(brightness);
  }

  public setMapType(mapType: string) {
    this.styleService?.setMapType(mapType);
  }

  public addEntityToMap(entity: TacticalEntity) {
    if (this.entityRenderer) {
      this.entityRenderer.addEntityToMap(entity);
    } else {
      console.error("❌ EntityRenderer not initialized");
    }
  }

  public updateEntityToMap(entity: TacticalEntity) {
    if (this.entityRenderer) {
      this.entityRenderer.updateEntityToMap(entity);
    } else {
      console.error("❌ EntityRenderer not initialized");
    }
  }

  public removeEntityFromMap(entityId: string) {
    if (this.entityRenderer) {
      this.entityRenderer.removeEntityFromMap(entityId);
    } else {
      console.error("❌ EntityRenderer not initialized");
    }
  }

  public focusOnEntity(entity: TacticalEntity) {
    if (this.entityRenderer) {
      this.entityRenderer.focusOnEntity(entity);
    } else {
      console.error("❌ EntityRenderer not initialized");
    }
  }

  public updateEntityColors() {
    if (this.layerManager) {
      this.layerManager.updateEntityColors();
    } else {
      console.error("❌ LayerManager not initialized");
    }
  }

  public destroy() {
    this.detachMapErrorHandlers?.();
    this.detachMapErrorHandlers = null;
    this.drawingService?.destroy();
    this.drawingService = null;
    this.measurementService = null;
    this.styleService = null;
    this.layerManager = null;
    this.entityRenderer = null;
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}

