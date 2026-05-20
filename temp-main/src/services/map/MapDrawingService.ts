import type { Map as MaplibreMap } from 'maplibre-gl';
import type { EntityType, TacticalEntity } from '@domain/models/entity';
import { MapEntityRenderer } from './MapEntityRenderer';
import { DrawModeWiring } from './drawing/drawModeWiring';
import { MeasurementDrawHandler } from './drawing/measurementDrawHandler';
import { TacticalDrawSession } from './drawing/tacticalDrawSession';
import {
  type DrawingCallbacks,
  type DrawingUiState,
  isTacticalDrawType,
} from './drawing/drawTypes';
import type { MapLayerEntity } from './entity-manager/entityManagerTypes';

export type { DrawingUiState } from './drawing/drawTypes';

/**
 * Orchestrates tactical map drawing (click + finish) with optional MapLibre Draw
 * for polygon/line vertex edit. Draw is lazy-attached with MapLibre-safe styles.
 */
export class MapDrawingService {
  private readonly drawWiring: DrawModeWiring;
  private readonly measurement: MeasurementDrawHandler;
  private readonly tactical: TacticalDrawSession;
  private callbacks: DrawingCallbacks | null = null;
  private activeFinishEdit: (() => void) | null = null;

  constructor(map: MaplibreMap, entityRenderer: MapEntityRenderer) {
    this.measurement = new MeasurementDrawHandler(map);
    this.tactical = new TacticalDrawSession(map, entityRenderer, this.measurement);
    this.drawWiring = new DrawModeWiring(map, {
      onLibraryTakeover: () => this.tactical.pauseMapListeners(),
      onLibraryRelease: () => this.tactical.resumeMapListeners(),
    });
    this.tactical.registerMarkerHandler((entity) => {
      this.callbacks?.onEntityDrawn(entity);
      this.resetState();
    });
    this.tactical.setUiListener((state) => this.onUiStateChanged?.(state));
  }

  private onUiStateChanged?: (state: DrawingUiState | null) => void;

  public initialize(callbacks: DrawingCallbacks): void {
    this.setCallbacks(callbacks);
  }

  public setCallbacks(callbacks: DrawingCallbacks): void {
    this.callbacks = callbacks;
    this.drawWiring.setCallbacks(callbacks);
  }

  public setUiListener(listener: (state: DrawingUiState | null) => void): void {
    this.onUiStateChanged = listener;
    this.tactical.setUiListener(listener);
  }

  public getDrawControl() {
    return this.drawWiring.getDrawControl();
  }

  public removeDrawControl(): void {
    this.tactical.reset();
    this.measurement.clear();
    this.drawWiring.removeDrawControl();
  }

  public rebuildDrawControl(): void {
    this.drawWiring.rebuildDrawControl();
  }

  public registerFinishEdit(fn: () => void): void {
    this.activeFinishEdit = fn;
  }

  public triggerFinishEdit(): void {
    this.activeFinishEdit?.();
  }

  public finishEdit(): void {
    if (!this.callbacks) return;

    if (this.tactical.isActive()) {
      this.tactical.finish(
        this.callbacks.onEntityDrawn,
        this.callbacks.onEntityUpdated,
      );
      this.activeFinishEdit = null;
      return;
    }

    this.drawWiring.clearDrawState();
    this.activeFinishEdit = null;
    this.onUiStateChanged?.(null);
  }

  public setDrawingMode(mode: EntityType | null): void {
    this.resetState();
    if (!mode || !isTacticalDrawType(mode)) {
      return;
    }

    this.tactical.startCreate(mode);
    this.activeFinishEdit = () => this.finishEdit();
  }

  public setEditMode(entityId: string, entity?: MapLayerEntity): void {
    if (!entity || !isTacticalDrawType(entity.type)) return;
    if (!entity.coordinates || !Array.isArray(entity.coordinates)) return;

    this.resetState();
    this.tactical.startEdit(entityId, entity as TacticalEntity);
    this.activeFinishEdit = () => this.finishEdit();
  }

  public removeCirclePreview(): void {
    this.resetState();
  }

  public removeEllipsePreview(): void {
    this.resetState();
  }

  public removeSectorPreview(): void {
    this.resetState();
  }

  public removePolygonPreview(): void {
    this.resetState();
  }

  public removeLastDrawPreview(): void {
    this.resetState();
  }

  private resetState(): void {
    this.drawWiring.clearDrawState();
    this.tactical.reset();
    this.measurement.clear();
    this.activeFinishEdit = null;
    this.onUiStateChanged?.(null);
  }

  public destroy(): void {
    this.resetState();
    this.tactical.destroy();
    this.drawWiring.destroy();
    this.callbacks = null;
    this.onUiStateChanged = undefined;
    this.activeFinishEdit = null;
  }
}
