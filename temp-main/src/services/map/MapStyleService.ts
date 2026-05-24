import { servers } from '@/config/communication.json';
import {
  BASEMAP_IDS,
  BASEMAP_RASTER,
  BASEMAP_RETILE_NUDGE,
  BRIGHTNESS_OVERLAY,
  BRIGHTNESS_OVERLAY_WORLD_POLYGON,
  INITIAL_STYLE_SERVICE_BASEMAP_ID,
  STYLE_CHANGE_SAFETY_TIMEOUT_MS,
} from '@/services/map/config';
import { MapDrawingService } from './MapDrawingService';
import { MapEntityRenderer } from './MapEntityRenderer';
import type { MapServiceRuntime } from './mapServiceRuntime';

const DARKNESS_LAYER_ID = BASEMAP_IDS.darknessOverlayLayer;
const DARKNESS_SOURCE_ID = BASEMAP_IDS.darknessOverlaySource;

export class MapStyleService {
  private map: maplibregl.Map;
  private drawingService: MapDrawingService;
  private entityRenderer: MapEntityRenderer;
  private readonly runtime: MapServiceRuntime;
  private styleChangeCallbacks: (() => void)[] = [];
  private isChangingStyle: boolean = false;
  private currentMapType: string = INITIAL_STYLE_SERVICE_BASEMAP_ID;

  constructor(
    map: maplibregl.Map,
    drawingService: MapDrawingService,
    entityRenderer: MapEntityRenderer,
    runtime: MapServiceRuntime,
  ) {
    this.map = map;
    this.drawingService = drawingService;
    this.entityRenderer = entityRenderer;
    this.runtime = runtime;
  }

  public setInitialMapType(mapType: string) {
    this.currentMapType = mapType;
  }

  public getCurrentMapType(): string {
    return this.currentMapType;
  }

  public onStyleChanged(callback: () => void) {
    this.styleChangeCallbacks.push(callback);
  }

  private notifyStyleChanged() {
    this.styleChangeCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('Error in style change callback:', error);
      }
    });
  }

  public changeMapStylePreservingEntities(newStyle: maplibregl.StyleSpecification | string) {
    if (!this.map) return;
    if (this.isChangingStyle) {
      this.isChangingStyle = false;
    }
    if (this.isChangingStyle) return;
    this.isChangingStyle = true;
    const safetyTimeout = setTimeout(() => {
      if (this.isChangingStyle) {
        this.isChangingStyle = false;
      }
    }, STYLE_CHANGE_SAFETY_TIMEOUT_MS);

    const allEntities = this.runtime.getAllEntities();
    this.drawingService.removeDrawControl();

    this.map.setStyle(newStyle);
    const restoreEverything = () => {
      try {
        this.drawingService.removeDrawControl();
        this.drawingService.rebuildDrawControl();
        if (allEntities.length > 0) {
          allEntities.forEach((entity) => {
            this.entityRenderer.addEntityToMap(entity);
          });
        }
        this.notifyStyleChanged();
        this.isChangingStyle = false;
        clearTimeout(safetyTimeout);
      } catch (error) {
        console.error('Error during style restoration:', error);
        this.isChangingStyle = false;
        clearTimeout(safetyTimeout);
      }
    };

    this.map.off('styledata', restoreEverything);
    this.map.off('load', restoreEverything);
    this.map.once('styledata', restoreEverything);
    this.map.once('load', restoreEverything);
  }

  public setRotation(rotation: number) {
    if (this.map) {
      this.map.setBearing(rotation);
    }
  }

  public setBrightness(brightness: number) {
    if (!this.map || !this.map.isStyleLoaded()) return;

    if (this.map.getLayer(DARKNESS_LAYER_ID)) {
      this.map.removeLayer(DARKNESS_LAYER_ID);
    }
    if (this.map.getSource(DARKNESS_SOURCE_ID)) {
      this.map.removeSource(DARKNESS_SOURCE_ID);
    }

    let normalized = brightness;
    if (normalized <= BRIGHTNESS_OVERLAY.sliderScaleCutoff) {
      normalized = normalized * 100;
    }

    let opacity = 0;
    if (normalized < BRIGHTNESS_OVERLAY.visibilityThreshold) {
      opacity = (BRIGHTNESS_OVERLAY.visibilityThreshold - normalized) /
        BRIGHTNESS_OVERLAY.visibilityThreshold;
      opacity = Math.min(BRIGHTNESS_OVERLAY.maxOpacity, Math.max(0, opacity));
    }

    if (opacity > 0) {
      this.map.addSource(DARKNESS_SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: BRIGHTNESS_OVERLAY_WORLD_POLYGON as unknown as number[][][],
          },
        },
      });

      let beforeId: string | undefined;
      const layers = this.map.getStyle().layers;
      if (layers) {
        const entityLayer = layers.find((l) =>
          l.id.startsWith(BRIGHTNESS_OVERLAY.insertBeforeLayerPrefix),
        );
        if (entityLayer) beforeId = entityLayer.id;
      }
      this.map.addLayer(
        {
          id: DARKNESS_LAYER_ID,
          type: 'fill',
          source: DARKNESS_SOURCE_ID,
          paint: {
            'fill-color': BRIGHTNESS_OVERLAY.fillColor,
            'fill-opacity': opacity,
          },
        },
        beforeId,
      );
    }
  }

  public setMapType(mapType: string) {
    if (!this.map) return;
    const src = this.map.getSource(BASEMAP_IDS.rasterSource) as maplibregl.RasterTileSource;
    if (!src) return;
    const ver = Date.now();
    src.setTiles([
      `http://${servers.mapServer}/tiles/${mapType}/{z}/{x}/{y}.${BASEMAP_RASTER.tileExt}?v=${ver}`,
    ]);
    const center = this.map.getCenter();

    this.map.easeTo({
      center: [center.lng + BASEMAP_RETILE_NUDGE.nudgeLngDeg, center.lat],
      duration: 0,
    });

    setTimeout(() => {
      this.map?.easeTo({
        center: [center.lng, center.lat],
        duration: 0,
      });
    }, BASEMAP_RETILE_NUDGE.restoreDelayMs);
    this.currentMapType = mapType;
  }
}
