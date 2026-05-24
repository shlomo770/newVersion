/**
 * Time-based constants for the map feature: debounces, throttles,
 * animation durations, watchdog timeouts.
 *
 * Anything counted in milliseconds that affects the user-visible cadence
 * of the map lives here so latency-tuning is a single-file edit.
 *
 * Component-internal one-off durations (e.g. a `setTimeout` that
 * implements a single algorithm step) may stay inline if they're not
 * tunable — judgment call.
 */

/* ------------------------------------------------------------------ */
/*  Animations & camera                                                 */
/* ------------------------------------------------------------------ */

/** Duration of `panTo` when centering on a target / entity / status-bar
 *  coordinate click. */
export const MAP_PAN_TO_DURATION_MS = 800;

/** Duration of `flyTo` when zooming to a target / entity selection. */
export const MAP_FLY_TO_DURATION_MS = 1000;

/* ------------------------------------------------------------------ */
/*  Style swapping (basemap change)                                     */
/* ------------------------------------------------------------------ */

/** Safety net — if `styledata` / `load` never fire after `setStyle`,
 *  drop the in-flight flag this long after `setStyle()` was called. */
export const STYLE_CHANGE_SAFETY_TIMEOUT_MS = 10000;

/** Delay between the two micro-recenters performed after a raster
 *  basemap swap (forces MapLibre to rebuild tiles). */
export const BASEMAP_RECENTER_DELAY_MS = 200;

/* ------------------------------------------------------------------ */
/*  User interaction                                                    */
/* ------------------------------------------------------------------ */

/** Finger movement (px) that cancels long-press context menu. */
export const MAP_TOUCH_LONG_PRESS_CANCEL_PX = 10;

/** Long-press duration before the map context menu opens. */
export const MAP_CONTEXT_MENU_LONG_PRESS_MS = 500;

/** Debounce window before the target-selection sub-menu auto-closes. */
export const MAP_TARGET_SELECTION_CLOSE_MS = 100;

/* ------------------------------------------------------------------ */
/*  Status bar                                                          */
/* ------------------------------------------------------------------ */

/** Debounce window for the elevation fetch triggered by my-position
 *  changes shown in the status bar. */
export const STATUS_BAR_ELEVATION_DEBOUNCE_MS = 300;
