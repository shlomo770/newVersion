import {
  createCirclePolygon,
  createEllipsePolygon,
  createRectangleCoordinates,
} from '@shared/lib/geo';
import { createCircleMode, createRectangleMode } from '@shared/lib/geo/mapboxDrawModes';
import type { Coordinates } from '@domain/models/coordinates';

type DrawModeContext = Record<string, unknown>;

interface DrawFeatureLike {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

function ctx(this: DrawModeContext) {
  return this as {
    newFeature: (f: DrawFeatureLike) => DrawFeatureLike;
    addFeature: (f: DrawFeatureLike) => void;
    clearSelectedFeatures: () => void;
    updateUIClasses: (c: Record<string, string>) => void;
    activateUIButton: (n: string) => void;
    setActionableState: (s: Record<string, boolean>) => void;
    getCurrent: () => { properties: { active: string } } | undefined;
    changeMode: (m: string, o?: Record<string, unknown>) => void;
    map: { fire: (event: string, payload?: Record<string, unknown>) => void };
  };
}

function baseSetup(
  this: DrawModeContext,
  shape: 'circle' | 'ellipse' | 'rectangle',
): DrawFeatureLike {
  const api = ctx.call(this);
  const polygon = api.newFeature({
    type: 'Feature',
    properties: { shape },
    geometry: { type: 'Polygon', coordinates: [[]] },
  });
  api.addFeature(polygon);
  api.clearSelectedFeatures();
  api.updateUIClasses({ mouse: 'add' });
  api.activateUIButton('Polygon');
  api.setActionableState({ trash: true });
  return polygon;
}

function updatePolygonFromCoords(
  feature: DrawFeatureLike,
  center: Coordinates,
  edge: Coordinates,
  builder: (c: Coordinates, e: Coordinates, steps: number) => Coordinates[],
): void {
  const ring = builder(center, edge, 64).map((pt) => [pt.lng, pt.lat]);
  if (ring.length > 0) {
    const first = ring[0];
    ring.push([first[0], first[1]]);
  }
  feature.geometry.coordinates = [ring];
}

/** Two-click circle mode backed by @shared/lib/geo polygon math. */
export function createTacticalCircleMode(): DrawModeContext {
  const base = createCircleMode();
  return {
    ...base,
    onSetup(this: DrawModeContext): DrawFeatureLike {
      const feature = baseSetup.call(this, 'circle');
      (this as { _center: Coordinates | null })._center = null;
      return feature;
    },
    onClick(this: DrawModeContext, state: { feature: DrawFeatureLike }, e: { lngLat: { lng: number; lat: number } }): void {
      const api = ctx.call(this);
      const center = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      const holder = this as { _center: Coordinates | null };
      if (!holder._center) {
        holder._center = center;
        updatePolygonFromCoords(state.feature, center, center, createCirclePolygon);
        return;
      }
      updatePolygonFromCoords(state.feature, holder._center, center, createCirclePolygon);
      api.changeMode('simple_select', { featureIds: [state.feature] });
      api.map.fire('draw.create', { features: [state.feature] });
    },
    onTap(
      this: DrawModeContext,
      state: { feature: DrawFeatureLike },
      e: { lngLat: { lng: number; lat: number } },
    ): void {
      (this as { onClick: (s: typeof state, ev: typeof e) => void }).onClick(state, e);
    },
  };
}

/** Two-click ellipse mode backed by @shared/lib/geo polygon math. */
export function createTacticalEllipseMode(): DrawModeContext {
  return {
    onSetup(this: DrawModeContext): DrawFeatureLike {
      const feature = baseSetup.call(this, 'ellipse');
      (this as { _center: Coordinates | null })._center = null;
      return feature;
    },
    onClick(this: DrawModeContext, state: { feature: DrawFeatureLike }, e: { lngLat: { lng: number; lat: number } }): void {
      const api = ctx.call(this);
      const edge = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      const holder = this as { _center: Coordinates | null };
      if (!holder._center) {
        holder._center = edge;
        updatePolygonFromCoords(state.feature, edge, edge, createEllipsePolygon);
        return;
      }
      updatePolygonFromCoords(state.feature, holder._center, edge, createEllipsePolygon);
      api.changeMode('simple_select', { featureIds: [state.feature] });
      api.map.fire('draw.create', { features: [state.feature] });
    },
    onTap(
      this: DrawModeContext,
      state: { feature: DrawFeatureLike },
      e: { lngLat: { lng: number; lat: number } },
    ): void {
      (this as { onClick: (s: typeof state, ev: typeof e) => void }).onClick(state, e);
    },
  };
}

/** Rectangle mode using geo rectangle coordinate builder on two clicks. */
export function createTacticalRectangleMode(): DrawModeContext {
  const base = createRectangleMode();
  return {
    ...base,
    onSetup(this: DrawModeContext): DrawFeatureLike {
      const feature = baseSetup.call(this, 'rectangle');
      (this as { _anchor: Coordinates | null })._anchor = null;
      return feature;
    },
    onClick(this: DrawModeContext, state: { feature: DrawFeatureLike }, e: { lngLat: { lng: number; lat: number } }): void {
      const api = ctx.call(this);
      const point = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      const holder = this as { _anchor: Coordinates | null };
      if (!holder._anchor) {
        holder._anchor = point;
        return;
      }
      const ring = createRectangleCoordinates(holder._anchor, point).map((pt) => [pt.lng, pt.lat]);
      if (ring.length > 0) {
        const first = ring[0];
        ring.push([first[0], first[1]]);
      }
      state.feature.geometry.coordinates = [ring];
      api.changeMode('simple_select', { featureIds: [state.feature] });
      api.map.fire('draw.create', { features: [state.feature] });
    },
    onTap(
      this: DrawModeContext,
      state: { feature: DrawFeatureLike },
      e: { lngLat: { lng: number; lat: number } },
    ): void {
      (this as { onClick: (s: typeof state, ev: typeof e) => void }).onClick(state, e);
    },
  };
}

export function buildCustomDrawModes(
  defaultModes: Record<string, DrawModeContext>,
): Record<string, DrawModeContext> {
  return {
    ...defaultModes,
    draw_circle: createTacticalCircleMode(),
    draw_ellipse: createTacticalEllipseMode(),
    draw_rectangle: createTacticalRectangleMode(),
  };
}
