/**
 * Visual / paint / layout constants for the map feature.
 *
 * Every magic number that affects what a target / trail / ring / label /
 * assignment line / jeep / taboo / LOS / gun / radar / measurement /
 * dim-overlay looks like on the map lives here. MapLibre layer
 * components consume these directly as `paint` / `layout` properties —
 * components never hardcode them.
 *
 * Where the value already maps cleanly to a `theme.config.ts` token
 * (panel backgrounds, generic text colors), use the theme. Where the
 * value is map-specific (line dash patterns, icon zoom-interpolation
 * stops, ring radii, recommended-blink cadence), keep it here.
 */

import type {
  CircleLayerSpecification,
  ExpressionSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from 'maplibre-gl';

/* ------------------------------------------------------------------ */
/*  Targets lifecycle                                                   */
/* ------------------------------------------------------------------ */

/**
 * Init retry tuning for the bulletproof TargetsLayer install loop.
 * Worst-case wait before init gives up = `retryIntervalMs * maxAttempts`.
 */
export const TARGETS_INIT_CONFIG = {
  initialDelayMs: 50,
  retryIntervalMs: 200,
  maxAttempts: 50,
} as const;

/* ------------------------------------------------------------------ */
/*  Targets — trails                                                    */
/* ------------------------------------------------------------------ */

export const TARGET_TRAIL_PAINT: LineLayerSpecification['paint'] = {
  'line-color': '#000000',
  'line-width': 2,
  'line-opacity': 0.9,
  'line-dasharray': [1, 1],
};

/* ------------------------------------------------------------------ */
/*  Targets — icon symbol                                               */
/* ------------------------------------------------------------------ */

/** Zoom-interpolated icon size. Larger when zoomed in. */
export const TARGET_ICON_SIZE_BY_ZOOM: SymbolLayerSpecification['layout'] = {
  'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.45, 10, 0.6, 15, 0.75],
  'icon-allow-overlap': true,
  'icon-rotation-alignment': 'map',
  'icon-rotate': ['coalesce', ['get', 'heading'], 0],
};

/** Fixed size for the destroyed-X symbol — does NOT interpolate. */
export const TARGET_DESTROYED_ICON_SIZE = 0.4;

/* ------------------------------------------------------------------ */
/*  Targets — status rings                                              */
/* ------------------------------------------------------------------ */

export const TARGET_RING_RED_PAINT: CircleLayerSpecification['paint'] = {
  'circle-stroke-color': '#dd4141',
  'circle-stroke-width': 3,
  'circle-stroke-opacity': 0.9,
  'circle-radius': 24,
  'circle-color': 'rgba(0,0,0,0)',
};

export const TARGET_RING_RECOMMENDED_PAINT: CircleLayerSpecification['paint'] = {
  'circle-stroke-color': '#fff400',
  'circle-stroke-width': 3,
  'circle-stroke-opacity': 0.9,
  'circle-radius': 24,
  'circle-color': 'rgba(0,0,0,0)',
};

/** Recommended-ring blink cadence + opacities. */
export const TARGETS_RECOMMENDED_BLINK = {
  intervalMs: 600,
  opacityOn: 0.85,
  opacityOff: 0.25,
} as const;

/* ------------------------------------------------------------------ */
/*  Targets — assignment lines                                          */
/* ------------------------------------------------------------------ */

/** Solid red line — target locked. */
export const TARGET_ASSIGNMENT_LOCKED_PAINT: LineLayerSpecification['paint'] = {
  'line-color': '#ff2b2b',
  'line-width': 1.5,
  'line-dasharray': [1, 0],
};

/** Cyan dashed — target allocated. */
export const TARGET_ASSIGNMENT_ALLOCATED_PAINT: LineLayerSpecification['paint'] = {
  'line-color': '#58e1db',
  'line-width': 1.5,
  'line-dasharray': [4, 4],
};

/** Red dashed — target assigned but not yet locked. */
export const TARGET_ASSIGNMENT_ASSIGNED_PAINT: LineLayerSpecification['paint'] = {
  'line-color': '#ff2b2b',
  'line-width': 1.5,
  'line-dasharray': [4, 4],
};

/** Geometry for the arrow tip drawn at the target end of each
 *  assignment line. `lengthDeg` is in WGS84 degrees (small ~0.002
 *  works fine at typical zooms), `angleRad` is the half-angle from
 *  the assignment line to each tip line. */
export const TARGET_ASSIGNMENT_TIP_GEOMETRY = {
  lengthDeg: 0.002,
  angleRad: (25 * Math.PI) / 180,
} as const;

/* ------------------------------------------------------------------ */
/*  Targets — on-map labels                                             */
/* ------------------------------------------------------------------ */

export const TARGET_LABEL_LAYOUT: SymbolLayerSpecification['layout'] = {
  'text-field': ['get', 'label'],
  'text-font': ['Open Sans Semibold'],
  'text-size': 12,
  'text-offset': [0, 2],
  'text-anchor': 'top',
  'text-allow-overlap': true,
  'text-ignore-placement': false,
};

export const TARGET_LABEL_PAINT: SymbolLayerSpecification['paint'] = {
  'text-color': '#000000',
  'text-halo-width': 1,
};

/** Max-length truncation for the secondary range/altitude line in
 *  the on-map target label. */
export const TARGET_LABEL_NUMERIC_MAX_CHARS = 4;

/* ------------------------------------------------------------------ */
/*  Floating action buttons (map FAB)                                   */
/* ------------------------------------------------------------------ */

export const MAP_FAB = {
  sizePx: 56,
  iconSizeRem: 2,
  gapPx: 12,
} as const;

/* ------------------------------------------------------------------ */
/*  Jeep / my position                                                  */
/* ------------------------------------------------------------------ */

export const MY_POSITION_VISUALS = {
  /** Throttle between two consecutive `source.setData` calls. */
  updateThrottleMs: 100,

  /** Halo circle (cyan glow behind the jeep). */
  halo: {
    color: '#38bdf8',
    opacity: 0.2,
    blur: 0.9,
  } as const,

  /** Zoom-interpolated halo radius in pixels. */
  haloRadiusByZoom: [
    'interpolate',
    ['linear'],
    ['zoom'],
    6,
    22,
    10,
    34,
    14,
    48,
    18,
    62,
  ] as ExpressionSpecification,

  /** Jeep raster icon size by zoom (only when the icon image loaded). */
  jeepIconSizeByZoom: [
    'interpolate',
    ['linear'],
    ['zoom'],
    5,
    0.2,
    10,
    0.3,
    15,
    0.4,
  ] as ExpressionSpecification,

  /** Fallback circle drawn instead of the raster icon when it's missing. */
  fallback: {
    color: '#22c55e',
    strokeColor: '#ffffff',
    strokeWidth: 2,
    radiusByZoom: [
      'interpolate',
      ['linear'],
      ['zoom'],
      5,
      6,
      10,
      10,
      15,
      14,
    ] as ExpressionSpecification,
  } as const,
} as const;

/* ------------------------------------------------------------------ */
/*  Taboo zone sector                                                   */
/* ------------------------------------------------------------------ */

export const TABOO_ZONE_VISUALS = {
  /** Default sweep step (deg) for radar/sector polygon tessellation. */
  stepDeg: 1,
  fill: {
    color: '#FFB300',
    opacity: 0.35,
  } as const,
  line: {
    color: '#FFB300',
    width: 2,
  } as const,
} as const;

/* ------------------------------------------------------------------ */
/*  Line-of-sight sector                                                */
/* ------------------------------------------------------------------ */

export const LOS_VISUALS = {
  fillOpacity: 0.15,
  outlineWidth: 3,
  /** Color of a blocked ray line drawn from the sector apex. */
  blockedRayColor: '#ef4444',
  blockedRayWidth: 3,
  blockedRayOpacity: 1,
} as const;

/* ------------------------------------------------------------------ */
/*  Gun line-of-sight                                                   */
/* ------------------------------------------------------------------ */

export const GUN_LOS_VISUALS = {
  /** Length of the LOS line in meters. */
  lengthMeters: 1500,
  /** Rotation offset (degrees) applied to the `>` arrowhead glyph
   *  so it points along the azimuth. */
  headRotationOffsetDeg: -90,

  line: {
    color: '#38bdf8',
    opacity: 1,
    widthByZoom: [
      'interpolate',
      ['linear'],
      ['zoom'],
      5,
      1.2,
      10,
      1.7,
      14,
      2.2,
    ] as ExpressionSpecification,
  } as const,

  head: {
    field: '>',
    color: '#000000',
    haloWidth: 2,
    font: ['Open Sans Semibold'] as ReadonlyArray<string>,
    sizeByZoom: [
      'interpolate',
      ['linear'],
      ['zoom'],
      5,
      14,
      10,
      18,
      14,
      22,
    ] as ExpressionSpecification,
  } as const,
} as const;

/* ------------------------------------------------------------------ */
/*  Radar non-coverage sectors                                          */
/* ------------------------------------------------------------------ */

export const RADAR_COVERAGE_VISUALS = {
  stepDeg: 1,
  fill: {
    color: '#0400ff',
    opacity: 0.2,
  } as const,
  line: {
    color: '#7574ad',
    width: 2,
  } as const,
} as const;

/* ------------------------------------------------------------------ */
/*  Brightness "dim the world" overlay                                  */
/* ------------------------------------------------------------------ */

export const MAP_DIMMER_VISUALS = {
  /** Default fill color when the React component is mounted without
   *  an explicit `color` prop. */
  defaultFillColor: '#000',
} as const;

/**
 * Brightness overlay owned by MapStyleService (different from the
 * React MapDimmerAuto overlay). Brightness 0..100 maps to opacity
 * `(threshold - brightness) / threshold` clamped to `[0, maxOpacity]`.
 * If the caller passes a 0..2 slider value it's auto-scaled by 100.
 */
export const BRIGHTNESS_OVERLAY = {
  fillColor: '#000',
  /** Brightness below this triggers any overlay at all. */
  visibilityThreshold: 80,
  /** Hard ceiling on overlay opacity to keep the map legible. */
  maxOpacity: 0.85,
  /** Slider 0..1 is auto-scaled to 0..100 when below this value. */
  sliderScaleCutoff: 2,
  /** Layer placed just below the first `entity-layer-` so it dims
   *  the basemap but not entity-owned overlays. */
  insertBeforeLayerPrefix: 'entity-layer-',
} as const;

/**
 * World-cover polygon used as the geometry for the brightness
 * overlay (a single rectangle spanning the entire WGS84 extent).
 */
export const BRIGHTNESS_OVERLAY_WORLD_POLYGON: ReadonlyArray<ReadonlyArray<[number, number]>> = [
  [
    [-180, -85],
    [180, -85],
    [180, 85],
    [-180, 85],
    [-180, -85],
  ],
];

/**
 * Workaround for some MapLibre raster sources not redrawing after
 * `setTiles`: nudge the camera by `nudgeLngDeg` then restore after
 * `restoreDelayMs`. Set `nudgeLngDeg` to 0 to disable.
 */
export const BASEMAP_RETILE_NUDGE = {
  nudgeLngDeg: 5,
  restoreDelayMs: 200,
} as const;

/* ------------------------------------------------------------------ */
/*  Measurement tool (distance + area)                                  */
/* ------------------------------------------------------------------ */

export const MEASURE_VISUALS = {
  /** Tangerine-orange used consistently across point/line/fill. */
  accentColor: '#f59e42',
  pointFill: '#f59e42',
  pointStroke: '#fff',
  pointRadius: 6,
  pointStrokeWidth: 2,
  /** Distance line. */
  distanceLineWidth: 4,
  /** Live distance preview while dragging the second point. */
  previewLineWidth: 2,
  previewLineOpacity: 0.6,
  previewLineDash: [2, 2] as [number, number],
  /** Filled area polygon. */
  areaFillOpacity: 0.2,
  areaLineWidth: 3,
  areaPreviewFillOpacity: 0.15,

  /** Live label drawn next to the cursor during measurement. */
  label: {
    color: '#1e3a8a',
    haloColor: '#ffffff',
    haloWidth: 2,
    textSize: 13,
    font: ['Open Sans Semibold'] as ReadonlyArray<string>,
    offsetY: 1.6,
  } as const,
} as const;

/* ------------------------------------------------------------------ */
/*  Generic map label defaults (entity labels)                           */
/* ------------------------------------------------------------------ */

export const MAP_LABEL_DEFAULTS = {
  textColor: '#1a1a1a',
  haloColor: '#ffffff',
  haloWidth: 3,
  textSize: 12,
  font: ['Open Sans Semibold'] as ReadonlyArray<string>,
} as const;

/* ------------------------------------------------------------------ */
/*  Basemap raster + vector style defaults                              */
/* ------------------------------------------------------------------ */

export const BASEMAP_RASTER = {
  /** Image format requested from the tile server. */
  tileExt: 'webp',
  tileSize: 256,
  minZoom: 0,
  maxZoom: 15,
} as const;

export const BASEMAP_VECTOR = {
  minZoom: 0,
  maxZoom: 15,
  waterFillColor: '#00ffff',
  waterFillOpacity: 0.4,
} as const;

/** Glyphs URL pattern used by all generated styles for symbol layers. */
export const BASEMAP_GLYPHS_URL = '/fonts/{fontstack}/{range}.pbf';

/* ------------------------------------------------------------------ */
/*  Entity layer paint defaults                                         */
/* ------------------------------------------------------------------ */

export const ENTITY_PAINT_DEFAULTS = {
  /** Fallback color when the entity has no explicit color set. */
  color: '#3b82f6',
  /** Stroke color used as fill-outline / circle-stroke fallback. */
  strokeColor: '#1e40af',
  strokeWidth: 2,
  /** Default opacity when `transparency` is missing. */
  opacity: 0.3,
  /** Hand-picked category override for TABOOZONE markers. */
  tabooZoneColor: '#FFB300',
  /** Marker (circle) defaults. */
  marker: {
    radius: 8,
  } as const,
  /** Target overlay (legacy "target" entity type — large red disc). */
  target: {
    radius: 40,
    color: '#ff0000',
    strokeColor: '#ffffff',
    strokeWidth: 4,
  } as const,
  /** Icon-marker symbol layout. */
  iconMarker: {
    sizeScale: 1.8,
  } as const,
} as const;

/* ------------------------------------------------------------------ */
/*  Entity category default colors                                      */
/* ------------------------------------------------------------------ */

/** Default fill color per entity category. The category enum keys
 *  (`WCO_HOLD`, `WCO_FREE`, etc.) intentionally come from the domain
 *  layer and are looked up here at build time. */
export const ENTITY_CATEGORY_DEFAULT_COLORS = {
  wcoHold: '#ff0000',
  wcoFree: '#25ff00',
  fallback: '#3b82f6',
} as const;

/** Inbound color fallback when the server omits a color on entity sync. */
export const ENTITY_INBOUND_DEFAULT_COLOR = '#3388ff';
