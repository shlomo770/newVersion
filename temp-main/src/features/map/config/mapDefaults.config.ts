/**
 * Default UI / domain state for the map feature.
 *
 * Every value that ships as part of a Redux slice's `initialState`
 * — viewport, basemap, coordinate system, settings timers, LOS sector
 * color, radar form defaults — is centralized here so a launch-time
 * tweak is a single-file edit.
 *
 * Components and slices import these defaults rather than hard-coding
 * literals inline.
 */

import type { Coordinates } from '@domain/models/coordinates';

/* ------------------------------------------------------------------ */
/*  Viewport                                                            */
/* ------------------------------------------------------------------ */

/** Initial map center on first load — over Israel. */
export const DEFAULT_MAP_CENTER: Coordinates = {
  lng: 34.93993624253132,
  lat: 31.9865223910248,
};

/** "Reset map" action recenters here (slightly different from boot). */
export const RESET_MAP_CENTER: Coordinates = {
  lng: 34.784,
  lat: 32.055,
};

/** Initial zoom level on first load. */
export const DEFAULT_MAP_ZOOM = 13;

/** Zoom level after "Reset map" action. */
export const RESET_MAP_ZOOM = 15;

/** Map bearing (rotation) defaults. */
export const DEFAULT_MAP_ROTATION = 0;

/* ------------------------------------------------------------------ */
/*  Basemap                                                             */
/* ------------------------------------------------------------------ */

/** Initial basemap on first load. Must match a MAP_TYPES.id. */
export const DEFAULT_BASEMAP_ID = 'carto-light';

/** "Reset map" action restores this basemap too. */
export const RESET_BASEMAP_ID = 'carto-light';

/** Initial basemap used by the MapStyleService when no slice is wired
 *  yet (e.g. very early in boot). */
export const INITIAL_STYLE_SERVICE_BASEMAP_ID = 'vector-global';

/* ------------------------------------------------------------------ */
/*  Brightness                                                          */
/* ------------------------------------------------------------------ */

export const BRIGHTNESS_CONFIG = {
  /** Initial brightness value (0 = darkest, 1 = no overlay). */
  initial: 0,
  /** Value applied by "Reset map". */
  resetValue: 1,
  /** Slider min in the UI. */
  uiMin: 0,
  /** Slider max in the UI. */
  uiMax: 1,
  /** Slider step in the UI. */
  uiStep: 0.1,
  /** Hard ceiling applied by the slice reducer to guard against
   *  out-of-range payloads. */
  clampMax: 2,
} as const;

/* ------------------------------------------------------------------ */
/*  Coordinate system                                                   */
/* ------------------------------------------------------------------ */

export const COORDINATES_DEFAULTS = {
  isUTM: false,
  /** UTM zone 36 covers Israel. */
  utmZone: 36,
} as const;

/* ------------------------------------------------------------------ */
/*  Settings slice (target lifecycle timers + LOS color)                */
/* ------------------------------------------------------------------ */

export const TARGET_LIFECYCLE_DEFAULTS = {
  /** Targets older than this become visually "inactive". */
  inactiveTargetTimeoutSec: 30,
  /** Targets stale longer than this are removed entirely. */
  disconnectedTargetTimeoutSec: 60,
  /** Delay before a destroyed target is removed from the map. */
  destroyedTargetRemoveDelaySec: 15,
} as const;

/** LOS sector color presented in the settings UI on first load. */
export const LOS_SECTOR_DEFAULT_COLOR = '#3d7fe0ff';

/** LOS color applied by the settings "Reset to defaults" action. */
export const LOS_SECTOR_RESET_COLOR = '#00ff00';

/** Default fill color + opacity used when a new entity category gets
 *  initialized in the settings UI. */
export const CATEGORY_VISUAL_DEFAULT = {
  color: '#4185e3',
  opacity: 0.4,
} as const;

/* ------------------------------------------------------------------ */
/*  Radar slice                                                         */
/* ------------------------------------------------------------------ */

export const RADAR_DEFAULTS = {
  workRoom: 1,
  freqIndex: 0,
  missionCategory: 1,
  minElevation: 0,
  blankingSectors: 0,
  /** Default coverage range (meters). */
  radarRange: 5000,
} as const;

/* ------------------------------------------------------------------ */
/*  Taboo zone                                                          */
/* ------------------------------------------------------------------ */

export const TABOO_ZONE_DEFAULTS = {
  /** Initial radius shown in the editor modal. */
  editorRadiusMeters: 5000,
  /** Default radius applied when an inbound zone arrives without one. */
  inboundFallbackRadiusMeters: 5000,
  /** Default radius applied when an editor creation starts. */
  creationRadiusMeters: 1500,
} as const;
