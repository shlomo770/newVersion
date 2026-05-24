/**
 * Stable MapLibre source + layer id constants for the map feature.
 *
 * Every id used in `addSource` / `addLayer` / `getLayer` /
 * `setLayoutProperty` / `setPaintProperty` for a map subsystem lives
 * here. No raw id literals are allowed in components, installers,
 * services, or utilities — always import.
 *
 * Organization: one named-export block per logical subsystem (targets,
 * jeep position, taboo, LOS, gun, radar, dim overlay, measurement,
 * tactical drawing, entity id builders, basemap raster/vector ids).
 */

/* ------------------------------------------------------------------ */
/*  Target feature sources                                              */
/* ------------------------------------------------------------------ */

export const TARGET_SOURCE_IDS = {
  /** Point features — one per visible target. */
  targets: 'targets',
  /** Line features — one per visible target's trail. */
  trails: 'targets-trails',
  /** Line features — assignment lines from the jeep to each engaged target. */
  assignmentLines: 'target-arrows',
  /** Line features — arrow tips on the target end of each assignment line. */
  assignmentTips: 'arrow-tips',
} as const;

/**
 * Layer install order is:
 *   trails → icons → destroyed → rings → assignment lines → labels.
 *
 * Two invariants worth preserving:
 *   - Icon symbol layer is the FIRST symbol-typed layer added.
 *   - Labels come LAST (or at least after the icon layer).
 * Violating either has historically triggered MapLibre's
 * `continuePlacement` crash.
 */
export const TARGET_LAYER_IDS = {
  trails: 'targets-trails-layer',
  icons: 'targets-layer',
  destroyed: 'targets-destroyed-layer',
  ringRed: 'targets-red-ring-layer',
  ringRecommended: 'targets-recommended-ring',
  assignmentLocked: 'target-arrows-layer',
  assignmentAllocated: 'target-arrows-layer-allocated',
  assignmentAssigned: 'target-arrows-locked',
  labels: 'targets-labels-layer',
} as const;

export type TargetLayerId = (typeof TARGET_LAYER_IDS)[keyof typeof TARGET_LAYER_IDS];
export type TargetSourceId = (typeof TARGET_SOURCE_IDS)[keyof typeof TARGET_SOURCE_IDS];

/* ------------------------------------------------------------------ */
/*  Jeep / "my position" feature                                        */
/* ------------------------------------------------------------------ */

export const MY_POSITION_IDS = {
  source: 'my-position',
  haloLayer: 'my-position-halo-layer',
  jeepLayer: 'my-position-jeep-layer',
  /** MapLibre image id loaded from the jeep raster path. */
  jeepImage: 'jeep',
} as const;

/* ------------------------------------------------------------------ */
/*  Taboo zone sector                                                   */
/* ------------------------------------------------------------------ */

export const TABOO_ZONE_IDS = {
  source: 'taboo-zone-sector',
  fillLayer: 'taboo-zone-sector-fill',
  lineLayer: 'taboo-zone-sector-line',
} as const;

/* ------------------------------------------------------------------ */
/*  Line-of-sight sector + blocked rays                                 */
/* ------------------------------------------------------------------ */

export const LOS_IDS = {
  sectorSource: 'los-sector-source',
  sectorFillLayer: 'los-sector-fill-layer',
  sectorOutlineLayer: 'los-sector-outline-layer',
  /** Per-ray source id is `${raySourcePrefix}${index}`. */
  raySourcePrefix: 'los-ray-source-',
  /** Per-ray layer id is `${rayLayerPrefix}${index}`. */
  rayLayerPrefix: 'los-ray-layer-',
} as const;

export function losRaySourceId(index: number): string {
  return `${LOS_IDS.raySourcePrefix}${index}`;
}

export function losRayLayerId(index: number): string {
  return `${LOS_IDS.rayLayerPrefix}${index}`;
}

/* ------------------------------------------------------------------ */
/*  Gun line-of-sight                                                   */
/* ------------------------------------------------------------------ */

export const GUN_LOS_IDS = {
  source: 'gun-los-source',
  lineLayer: 'gun-los-line-layer',
  headLayer: 'gun-los-head-layer',
} as const;

/* ------------------------------------------------------------------ */
/*  Radar non-coverage sectors                                          */
/* ------------------------------------------------------------------ */

export const RADAR_COVERAGE_IDS = {
  defaultPrefix: 'radar-nc',
  /** Layer-order hints — radar coverage is moved BELOW any of these
   *  to keep the non-coverage paint behind target / entity overlays. */
  overlayPrefixHints: [
    'targets-',
    'entity-',
    'entity-icon-',
    'entity-label-',
    'overlay-',
    'draw-',
  ] as const,
} as const;

export function radarSourceId(prefix: string = RADAR_COVERAGE_IDS.defaultPrefix): string {
  return `${prefix}-src`;
}
export function radarFillLayerId(prefix: string = RADAR_COVERAGE_IDS.defaultPrefix): string {
  return `${prefix}-fill`;
}
export function radarLineLayerId(prefix: string = RADAR_COVERAGE_IDS.defaultPrefix): string {
  return `${prefix}-line`;
}

/* ------------------------------------------------------------------ */
/*  Dim-the-world brightness overlay                                    */
/* ------------------------------------------------------------------ */

export const MAP_DIMMER_IDS = {
  layer: 'dim-world-layer',
  source: 'dim-world-layer-src',
} as const;

/* ------------------------------------------------------------------ */
/*  Measurement tool (distance + area)                                  */
/* ------------------------------------------------------------------ */

export const MEASURE_IDS = {
  distancePointsSource: 'measure-points',
  distancePointsLayer: 'measure-points',
  distanceLineSource: 'measure-line',
  distanceLineLayer: 'measure-line',
  distancePreviewSource: 'measure-line-preview',
  distancePreviewLayer: 'measure-line-preview',
  areaPointsSource: 'measure-area-points',
  areaPointsLayer: 'measure-area-points',
  areaLineSource: 'measure-area-line',
  areaLineLayer: 'measure-area-line',
  areaFillSource: 'measure-area-fill',
  areaFillLayer: 'measure-area-fill',
  areaPreviewLineSource: 'measure-area-preview-line',
  areaPreviewLineLayer: 'measure-area-preview-line',
  areaPreviewFillSource: 'measure-area-preview-fill',
  areaPreviewFillLayer: 'measure-area-preview-fill',
  /** Live measurement label drawn next to the cursor. */
  drawLabelSource: 'draw-measure-label-source',
  drawLabelLayer: 'draw-measure-label-layer',
} as const;

/* ------------------------------------------------------------------ */
/*  Tactical draw session (free-form shape + polyline + handles)        */
/* ------------------------------------------------------------------ */

export const TACTICAL_DRAW_IDS = {
  shapeSource: 'draw-shape-source',
  shapeFill: 'draw-shape-fill',
  shapeLine: 'draw-shape-line',
  handlesSource: 'draw-handles-source',
  handlesLayer: 'draw-handles-layer',
  polyLineSource: 'draw-poly-line-source',
  polyLineLayer: 'draw-poly-line-layer',
  polyFillSource: 'draw-poly-fill-source',
  polyFillLayer: 'draw-poly-fill-layer',
  verticesSource: 'draw-vertices-source',
  verticesLayer: 'draw-vertices-layer',
} as const;

/* ------------------------------------------------------------------ */
/*  Basemap (tile sources + base style layers)                          */
/* ------------------------------------------------------------------ */

export const BASEMAP_IDS = {
  /** Raster tile source id used by carto-light / carto-dark / satellite / OSM. */
  rasterSource: 'rastertiles',
  /** Raster layer that references the raster tile source. */
  rasterLayer: 'raster-layer',
  /** Vector tile source id used by vector-global. */
  vectorSource: 'vectiles',
  /** Vector water fill layer (vector-global only). */
  vectorWaterLayer: 'water',
  /** Vector source-layer key for water (inside vector tiles). */
  vectorWaterSourceLayer: 'water',
  /** Brightness overlay (separate from MAP_DIMMER_IDS — owned by
   *  MapStyleService rather than the React component). */
  darknessOverlaySource: 'darkness-overlay',
  darknessOverlayLayer: 'darkness-overlay',
} as const;

/* ------------------------------------------------------------------ */
/*  Per-entity id builders                                              */
/* ------------------------------------------------------------------ */

/** Prefixes used by the entity manager so generic code can detect
 *  entity-owned layers by name (e.g. layer-ordering, style restore). */
export const ENTITY_LAYER_PREFIXES = {
  source: 'entity-',
  layer: 'entity-layer-',
  iconLayer: 'entity-icon-layer-',
  labelSource: 'entity-label-',
  labelLayer: 'entity-label-layer-',
} as const;

export function entitySourceIdFor(entityId: string): string {
  return `${ENTITY_LAYER_PREFIXES.source}${entityId}`;
}
export function entityLayerIdFor(entityId: string): string {
  return `${ENTITY_LAYER_PREFIXES.layer}${entityId}`;
}
export function entityIconLayerIdFor(entityId: string): string {
  return `${ENTITY_LAYER_PREFIXES.iconLayer}${entityId}`;
}
export function entityLabelSourceIdFor(entityId: string): string {
  return `${ENTITY_LAYER_PREFIXES.labelSource}${entityId}`;
}
export function entityLabelLayerIdFor(entityId: string): string {
  return `${ENTITY_LAYER_PREFIXES.labelLayer}${entityId}`;
}

/* ------------------------------------------------------------------ */
/*  Per-target dynamic id builders                                      */
/* ------------------------------------------------------------------ */

export const PER_TARGET_PREFIXES = {
  assignmentLine: 'target-line-',
  lockIcon: 'lock-icon-',
} as const;

export function perTargetAssignmentLineId(targetId: string): string {
  return `${PER_TARGET_PREFIXES.assignmentLine}${targetId}`;
}
export function perTargetLockIconId(targetId: string): string {
  return `${PER_TARGET_PREFIXES.lockIcon}${targetId}`;
}

/* ------------------------------------------------------------------ */
/*  Marker icon image ids                                               */
/* ------------------------------------------------------------------ */

export const MARKER_ICON_IMAGE_PREFIX = 'marker-icon-';

export function markerIconImageId(code: string): string {
  return `${MARKER_ICON_IMAGE_PREFIX}${code}`;
}
