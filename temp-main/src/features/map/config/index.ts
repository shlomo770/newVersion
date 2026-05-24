/**
 * Map feature configuration barrel.
 *
 * Layout:
 *  - `mapLayers.config`   — MapLibre source / layer / image id constants
 *                           plus id builders for per-entity / per-path / per-target overlays.
 *  - `mapVisuals.config`  — paint / layout / animation cadence constants
 *                           for every map subsystem.
 *  - `mapDefaults.config` — initial-state values consumed by Redux slices
 *                           (viewport, basemap, UTM, target lifecycle timers).
 *  - `mapTimers.config`   — debounces / throttles / animation durations.
 *  - `mapTools.config`    — toolbar flyout offsets + declarative filter
 *                           menu rows.
 */

export {
  /* Targets */
  TARGET_SOURCE_IDS,
  TARGET_LAYER_IDS,
  type TargetSourceId,
  type TargetLayerId,
  /* Jeep / my-position */
  MY_POSITION_IDS,
  /* Taboo */
  TABOO_ZONE_IDS,
  /* LOS */
  LOS_IDS,
  losRaySourceId,
  losRayLayerId,
  /* Gun LOS */
  GUN_LOS_IDS,
  /* Radar */
  RADAR_COVERAGE_IDS,
  radarSourceId,
  radarFillLayerId,
  radarLineLayerId,
  /* Map dimmer */
  MAP_DIMMER_IDS,
  /* Measurement */
  MEASURE_IDS,
  /* Tactical draw session */
  TACTICAL_DRAW_IDS,
  /* Basemap */
  BASEMAP_IDS,
  /* Entity id builders */
  ENTITY_LAYER_PREFIXES,
  entitySourceIdFor,
  entityLayerIdFor,
  entityIconLayerIdFor,
  entityLabelSourceIdFor,
  entityLabelLayerIdFor,
  /* JSON path id builders */
  JSON_PATH_PREFIXES,
  jsonPathSourceId,
  jsonPathLineLayerId,
  jsonPathPointsSourceId,
  jsonPathPointsLayerId,
  jsonPathLabelLayerId,
  /* Per-target dynamic ids */
  PER_TARGET_PREFIXES,
  perTargetAssignmentLineId,
  perTargetLockIconId,
  /* Marker icon image ids */
  MARKER_ICON_IMAGE_PREFIX,
  markerIconImageId,
} from './mapLayers.config';

export {
  TARGETS_INIT_CONFIG,
  TARGET_TRAIL_PAINT,
  TARGET_ICON_SIZE_BY_ZOOM,
  TARGET_DESTROYED_ICON_SIZE,
  TARGET_RING_RED_PAINT,
  TARGET_RING_RECOMMENDED_PAINT,
  TARGETS_RECOMMENDED_BLINK,
  TARGET_ASSIGNMENT_LOCKED_PAINT,
  TARGET_ASSIGNMENT_ALLOCATED_PAINT,
  TARGET_ASSIGNMENT_ASSIGNED_PAINT,
  TARGET_ASSIGNMENT_TIP_GEOMETRY,
  TARGET_LABEL_LAYOUT,
  TARGET_LABEL_PAINT,
  TARGET_LABEL_NUMERIC_MAX_CHARS,
  MAP_FAB,
  MY_POSITION_VISUALS,
  TABOO_ZONE_VISUALS,
  LOS_VISUALS,
  GUN_LOS_VISUALS,
  RADAR_COVERAGE_VISUALS,
  MAP_DIMMER_VISUALS,
  BRIGHTNESS_OVERLAY,
  BRIGHTNESS_OVERLAY_WORLD_POLYGON,
  BASEMAP_RETILE_NUDGE,
  MEASURE_VISUALS,
  MAP_LABEL_DEFAULTS,
  JSON_PATH_VISUALS,
  BASEMAP_RASTER,
  BASEMAP_VECTOR,
  BASEMAP_GLYPHS_URL,
  ENTITY_PAINT_DEFAULTS,
  ENTITY_CATEGORY_DEFAULT_COLORS,
  ENTITY_INBOUND_DEFAULT_COLOR,
} from './mapVisuals.config';

export {
  DEFAULT_MAP_CENTER,
  RESET_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  RESET_MAP_ZOOM,
  DEFAULT_MAP_ROTATION,
  DEFAULT_BASEMAP_ID,
  RESET_BASEMAP_ID,
  INITIAL_STYLE_SERVICE_BASEMAP_ID,
  BRIGHTNESS_CONFIG,
  COORDINATES_DEFAULTS,
  TARGET_LIFECYCLE_DEFAULTS,
  LOS_SECTOR_DEFAULT_COLOR,
  LOS_SECTOR_RESET_COLOR,
  CATEGORY_VISUAL_DEFAULT,
  RADAR_DEFAULTS,
  TABOO_ZONE_DEFAULTS,
} from './mapDefaults.config';

export {
  MAP_PAN_TO_DURATION_MS,
  MAP_FLY_TO_DURATION_MS,
  STYLE_CHANGE_SAFETY_TIMEOUT_MS,
  BASEMAP_RECENTER_DELAY_MS,
  MAP_CONTEXT_MENU_LONG_PRESS_MS,
  MAP_TOUCH_LONG_PRESS_CANCEL_PX,
  MAP_TARGET_SELECTION_CLOSE_MS,
  STATUS_BAR_ELEVATION_DEBOUNCE_MS,
} from './mapTimers.config';

export {
  MAP_TOOLBAR_FLYOUT,
  MAP_TOOLBAR_MENU,
  TARGET_FILTER_ITEMS,
  TARGET_FILTER_MENU_TITLE,
  MEASURE_MENU_ITEMS,
  MEASURE_MENU_TITLE,
  type FilterItemIcon,
  type FilterItemToggleAction,
  type TargetFilterItem,
  type MeasureToolMode,
  type MeasureMenuItem,
} from './mapTools.config';
