import type { Map as MaplibreMap } from 'maplibre-gl';
import type { Feature } from 'geojson';
import type { MapServiceRuntime } from '../mapServiceRuntime';
import { convertFeatureToCoordinates } from '../Helpers';
import {
  attachDrawControl,
  createMapDrawControl,
  detachDrawControl,
  type MapDrawControl,
} from './drawControlFactory';
import { DrawLibrarySessionGate, type DrawLibrarySessionHooks } from './drawEventIsolation';
import {
  type DrawingCallbacks,
  type TacticalDrawType,
  entityTypeToDrawMode,
  isTacticalDrawType,
} from './drawTypes';
import type { EntityType } from '@domain/models/entity';

type DrawCreateEvent = { features: Feature[] };
type DrawUpdateEvent = { features: Feature[] };

/**
 * Lazy MapLibre Draw integration. Tactical map listeners are paused via
 * DrawLibrarySessionGate while the library owns pointer handling.
 */
export class DrawModeWiring {
  private readonly map: MaplibreMap;
  private readonly runtime: MapServiceRuntime;
  private readonly sessionGate: DrawLibrarySessionGate;
  private draw: MapDrawControl | null = null;
  private attached = false;
  private libraryOwnsPointers = false;
  private callbacks: DrawingCallbacks | null = null;
  private activeLibraryType: TacticalDrawType | null = null;
  private boundCreate?: (event: DrawCreateEvent) => void;
  private boundUpdate?: (event: DrawUpdateEvent) => void;
  private drawEventsBound = false;

  constructor(
    map: MaplibreMap,
    runtime: MapServiceRuntime,
    hooks: DrawLibrarySessionHooks = {},
  ) {
    this.map = map;
    this.runtime = runtime;
    this.sessionGate = new DrawLibrarySessionGate(hooks);
  }

  private ensureDrawAttached(): MapDrawControl {
    if (this.draw && this.attached) {
      return this.draw;
    }
    this.draw = createMapDrawControl();
    attachDrawControl(this.map, this.draw);
    this.attached = true;
    this.bindDrawEvents();
    return this.draw;
  }

  private beginLibraryPointerCapture(): void {
    if (this.libraryOwnsPointers) return;
    this.libraryOwnsPointers = true;
    this.sessionGate.enter();
  }

  private endLibraryPointerCapture(): void {
    if (!this.libraryOwnsPointers) return;
    this.libraryOwnsPointers = false;
    this.sessionGate.leave();
  }

  getDrawControl(): MapDrawControl | null {
    return this.draw;
  }

  isLibraryActive(): boolean {
    return this.libraryOwnsPointers;
  }

  setCallbacks(callbacks: DrawingCallbacks): void {
    this.callbacks = callbacks;
  }

  private bindDrawEvents(): void {
    if (this.drawEventsBound) return;

    this.boundCreate = (event: DrawCreateEvent) => {
      if (!this.callbacks || !this.activeLibraryType) return;
      const feature = event.features[0];
      if (!feature) return;
      const coordinates = convertFeatureToCoordinates(feature);
      if (coordinates.length === 0) return;

      const properties =
        this.activeLibraryType === 'marker'
          ? { iconChar: this.runtime.getSelectedMarkerIcon() }
          : {};

      if (this.activeLibraryType === 'marker') {
        this.callbacks.onEntityDrawn({
          type: 'marker',
          coordinates,
          properties: { iconChar: String(properties.iconChar ?? 'E7BA') },
        });
      } else if (this.activeLibraryType === 'line') {
        this.callbacks.onEntityDrawn({ type: 'line', coordinates });
      } else {
        this.callbacks.onEntityDrawn({ type: this.activeLibraryType, coordinates });
      }

      this.draw?.deleteAll();
      this.draw?.changeMode('simple_select');
      this.activeLibraryType = null;
      this.endLibraryPointerCapture();
    };

    this.boundUpdate = (event: DrawUpdateEvent) => {
      if (!this.callbacks) return;
      const feature = event.features[0];
      if (!feature || typeof feature.id !== 'string') return;
      const coordinates = convertFeatureToCoordinates(feature);
      if (coordinates.length === 0) return;
      this.callbacks.onEntityUpdated(feature.id, coordinates);
    };

    this.map.on('draw.create', this.boundCreate);
    this.map.on('draw.update', this.boundUpdate);
    this.drawEventsBound = true;
  }

  private unbindDrawEvents(): void {
    if (!this.drawEventsBound) return;
    if (this.boundCreate) {
      this.map.off('draw.create', this.boundCreate);
      this.boundCreate = undefined;
    }
    if (this.boundUpdate) {
      this.map.off('draw.update', this.boundUpdate);
      this.boundUpdate = undefined;
    }
    this.drawEventsBound = false;
  }

  activateCreateMode(type: EntityType): boolean {
    if (!isTacticalDrawType(type)) {
      return false;
    }
    this.beginLibraryPointerCapture();
    const draw = this.ensureDrawAttached();
    draw.deleteAll();
    this.activeLibraryType = type;
    draw.changeMode(entityTypeToDrawMode(type));
    return true;
  }

  activateDrawShapeMode(type: Extract<TacticalDrawType, 'circle' | 'ellipse'>): void {
    this.beginLibraryPointerCapture();
    const draw = this.ensureDrawAttached();
    this.activeLibraryType = type;
    draw.deleteAll();
    draw.changeMode(entityTypeToDrawMode(type));
  }

  activateEditFeature(feature: Feature, entityId: string): void {
    this.beginLibraryPointerCapture();
    const draw = this.ensureDrawAttached();
    draw.deleteAll();
    const addedIds = draw.add(feature);
    const featureId = Array.isArray(addedIds) ? addedIds[0] : entityId;
    draw.changeMode('direct_select', { featureId });
  }

  clearDrawState(): void {
    this.activeLibraryType = null;
    if (this.draw) {
      this.draw.deleteAll();
      this.draw.changeMode('simple_select');
    }
    this.endLibraryPointerCapture();
  }

  removeDrawControl(): void {
    this.clearDrawState();
    if (this.draw && this.attached) {
      detachDrawControl(this.map, this.draw);
      this.attached = false;
    }
  }

  rebuildDrawControl(): void {
    if (!this.draw || !this.attached) return;
    detachDrawControl(this.map, this.draw);
    attachDrawControl(this.map, this.draw);
  }

  destroy(): void {
    this.unbindDrawEvents();
    this.removeDrawControl();
    this.sessionGate.reset();
    this.draw = null;
    this.callbacks = null;
    this.libraryOwnsPointers = false;
  }
}
