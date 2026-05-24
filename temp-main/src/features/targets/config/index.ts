/**
 * Targets feature configuration barrel.
 *
 * Layout:
 *  - `targetIcons.config`   — SVG basenames, faction colors, rasterizer
 *                              tuning, preload list.
 *  - `targetDefaults.config`— visibility + type-filter defaults (Redux
 *                              initial state).
 *  - `targetVisuals.config` — abort overlay layout helpers + destroyed-X
 *                              draw constants.
 *  - `targetStatus.config`  — abortable / assigned / locked status sets
 *                              and Hebrew display labels.
 *  - `targetRuntime.config` — WebSocket throttles, reconcile grace,
 *                              trail trimming window, status poll cadence.
 */

export {
  TARGET_ICON_PUBLIC_DIR,
  TARGET_ICON_RELATIVE_DIR,
  KNOWN_TARGET_ICON_TYPES,
  type KnownTargetIconType,
  TARGET_FALLBACK_ICON_TYPE,
  TARGET_ICON_VARIANTS,
  type TargetIconVariant,
  TARGET_ICON_VARIANT_SEPARATOR,
  TARGET_DESTROYED_ICON_ID,
  TARGET_FACTION_COLORS,
  TARGET_ICON_RASTER,
  TARGET_ICON_FALLBACK,
  TARGET_SVG_ORIGINAL_FILL_RE,
  TARGET_PRELOAD_ICON_IDS,
} from './targetIcons.config';

export {
  TARGET_VISIBILITY_DEFAULTS,
  TARGET_TYPE_DEFAULTS,
} from './targetDefaults.config';

export {
  TARGET_OVERLAY_LAYOUT,
  TARGET_DESTROYED_X_DRAW,
  targetIconScaleForZoom,
} from './targetVisuals.config';

export {
  ABORTABLE_TARGET_STATUSES,
  ASSIGNED_STATUSES,
  LOCKED_STATUSES,
  TARGET_STATUS_HEBREW_LABELS,
  TARGET_TYPE_HEBREW_LABELS,
  getTargetStatusHebrewLabel,
  getTargetTypeHebrewLabel,
} from './targetStatus.config';

export {
  TARGETS_UPDATE_THROTTLE_MS,
  TARGETS_CLEANUP_MS,
  TARGETS_RECONCILE_GRACE,
  TARGETS_INBOUND_CLEANUP_INTERVAL_MS,
  TARGET_TRAIL_WINDOW_MS,
  TARGET_STATUS_POLL_INTERVAL_MS,
} from './targetRuntime.config';
