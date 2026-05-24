/**
 * Map engine configuration — layer ids, paint defaults, and visual constants.
 *
 * Lives under `services/map` so MapLibre services never import from `@features`.
 * Feature UI re-exports via `@features/map/config` for backward compatibility.
 */

export {
  TARGET_SOURCE_IDS,
  TARGET_LAYER_IDS,
  type TargetSourceId,
  type TargetLayerId,
  MY_POSITION_IDS,
  TABOO_ZONE_IDS,
  LOS_IDS,
  losRaySourceId,
  losRayLayerId,
  GUN_LOS_IDS,
  RADAR_COVERAGE_IDS,
  radarSourceId,
  radarFillLayerId,
  radarLineLayerId,
  MAP_DIMMER_IDS,
  MEASURE_IDS,
  TACTICAL_DRAW_IDS,
  BASEMAP_IDS,
  ENTITY_LAYER_PREFIXES,
  entitySourceIdFor,
  entityLayerIdFor,
  entityIconLayerIdFor,
  entityLabelSourceIdFor,
  entityLabelLayerIdFor,
  PER_TARGET_PREFIXES,
  perTargetAssignmentLineId,
  perTargetLockIconId,
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
  BASEMAP_RASTER,
  BASEMAP_VECTOR,
  BASEMAP_GLYPHS_URL,
  ENTITY_PAINT_DEFAULTS,
  ENTITY_CATEGORY_DEFAULT_COLORS,
  ENTITY_INBOUND_DEFAULT_COLOR,
} from './mapVisuals.config';

export {
  INITIAL_STYLE_SERVICE_BASEMAP_ID,
  STYLE_CHANGE_SAFETY_TIMEOUT_MS,
} from './mapEngine.config';
