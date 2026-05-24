import type { EntityDrawDraft, EntityType, TacticalEntity } from '@domain/models/entity';
import type { Coordinates } from '@domain/models/coordinates';
import { MapService } from '@/services/map/MapService';
import type { MapDrawingUiState } from './mapDrawingTypes';

/**
 * Typed facade over MapLibre / MapService — components must not touch the raw map instance.
 */
import { createMapServiceRuntime } from './createMapServiceRuntime';

export class MapFacade {
  private readonly service: MapService;

  constructor(service?: MapService) {
    this.service = service ?? new MapService(createMapServiceRuntime());
  }

  get underlying(): MapService {
    return this.service;
  }

  getMap(): maplibregl.Map | null {
    return this.service.getMap();
  }

  getCurrentMapType(): string {
    return this.service.getCurrentMapType();
  }

  initialize(
    container: HTMLElement,
    onEntityDrawn: (entity: EntityDrawDraft) => void,
    onEntityUpdated: (id: string, coordinates: Coordinates[]) => void,
    onEntityDeleted: (id: string) => void,
    initialMapType: string,
    initialCenter: Coordinates,
    initialZoom: number,
  ): void {
    this.service.initialize(
      container,
      onEntityDrawn,
      onEntityUpdated,
      onEntityDeleted,
      initialMapType,
      initialCenter,
      initialZoom,
    );
  }

  destroy(): void {
    this.service.destroy();
  }

  setDrawingCallbacks(
    onEntityDrawn: (entity: EntityDrawDraft) => void,
    onEntityUpdated: (id: string, coordinates: Coordinates[]) => void,
    onEntityDeleted: (id: string) => void,
  ): void {
    this.service.setDrawingCallbacks(onEntityDrawn, onEntityUpdated, onEntityDeleted);
  }

  setDrawingUiListener(listener: (state: MapDrawingUiState | null) => void): void {
    this.service.setDrawingUiListener(listener);
  }

  setDrawingMode(mode: EntityType | 'measure' | 'measure-area' | null): void {
    this.service.setDrawingMode(mode);
  }

  setMapType(mapTypeId: string): void {
    this.service.setMapType(mapTypeId);
  }

  finishEdit(): void {
    this.service.finishEdit();
  }

  setEditMode(entityId: string, entity: TacticalEntity): void {
    this.service.setEditMode(entityId, entity);
  }

  focusOnEntity(entity: TacticalEntity): void {
    this.service.focusOnEntity(entity);
  }

  panTo(coordinates: Coordinates, options?: { duration?: number }): void {
    const map = this.getMap();
    if (!map) return;
    map.panTo([coordinates.lng, coordinates.lat], { duration: options?.duration ?? 800 });
  }

  setZoom(zoom: number, options?: { duration?: number }): void {
    const map = this.getMap();
    if (!map) return;
    map.setZoom(zoom, { duration: options?.duration ?? 300 });
  }

  projectToScreen(lng: number, lat: number): { x: number; y: number } | null {
    const map = this.getMap();
    if (!map) return null;
    const p = map.project([lng, lat]);
    return { x: p.x, y: p.y };
  }

  addEntityToMap(entity: TacticalEntity): void {
    this.service.addEntityToMap(entity);
  }

  updateEntityToMap(entity: TacticalEntity): void {
    this.service.updateEntityToMap(entity);
  }

  removeEntityFromMap(entityId: string): void {
    this.service.removeEntityFromMap(entityId);
  }

  updateEntityColors(): void {
    this.service.updateEntityColors();
  }

  renderMeasurement(points: Coordinates[]): void {
    this.service.renderMeasurement(points);
  }

  renderMeasurementPreview(start: Coordinates, current: Coordinates): void {
    this.service.renderMeasurementPreview(start, current);
  }

  clearMeasurementPreview(): void {
    this.service.clearMeasurementPreview();
  }

  clearMeasurement(): void {
    this.service.clearMeasurement();
  }

  renderAreaMeasurement(points: Coordinates[]): void {
    this.service.renderAreaMeasurement(points);
  }

  renderAreaMeasurementPreview(points: Coordinates[], current: Coordinates): void {
    this.service.renderAreaMeasurementPreview(points, current);
  }

  clearAreaMeasurementPreview(): void {
    this.service.clearAreaMeasurementPreview();
  }

  clearAreaMeasurement(): void {
    this.service.clearAreaMeasurement();
  }
}
