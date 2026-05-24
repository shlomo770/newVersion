/**
 * Centralized registry of every static UI icon path used across the app.
 *
 * Components import paths from this file instead of hand-typing
 * `./icons/foo.png`. This:
 *   - Removes scattered string literals (one source of truth).
 *   - Makes asset renames a single-line edit.
 *   - Surfaces the entire icon set at a glance for design review.
 *
 * Target *silhouette* SVGs are handled separately in
 * `src/features/targets/config/targetIcons.config.ts` (because they
 * have a faction-variant resolver + raster pipeline). UI affordance
 * icons (PNGs in the toolbar, sidebar, status bar, mode selector,
 * target cards) live here.
 *
 * Path conventions:
 *  - `./icons/foo.png`  — served by Vite from `public/icons` and used
 *                          inside `<img src=…>` mounted under the app
 *                          root.
 *  - `/icons/foo.png`   — absolute path; used by both `<img src>` and
 *                          `fetch()`-based loaders (jeep raster, image
 *                          `onError` fallbacks).
 */

/* ------------------------------------------------------------------ */
/*  Map toolbar (floating round launcher + main flyout)                 */
/* ------------------------------------------------------------------ */

export const MAP_TOOL_ICONS = {
  launcher: './icons/Map_512.png',
  brightness: './icons/brightness_512.png',
  ruler: './icons/ruler_512.png',
  video: './icons/VideoStreaming_512.png',
} as const;

/* ------------------------------------------------------------------ */
/*  Entities sidebar (nav cards + sections)                             */
/* ------------------------------------------------------------------ */

export const ENTITIES_SIDEBAR_ICONS = {
  /** Floating action button that opens the entities sidebar. */
  fab: './icons/folder_closed_512.png',
  /** Top-level nav cards. */
  missions: './icons/task_512.png',
  areas: './icons/polygon_512.png',
  points: './icons/pointing_center_512.png',
  /** Back arrow used across all sub-section headers. */
  back: './icons/back_arrow512.png',
} as const;

/* ------------------------------------------------------------------ */
/*  Status bar                                                          */
/* ------------------------------------------------------------------ */

export const STATUS_BAR_ICONS = {
  /** Overlay glyph shown on radar/INS/gun icons when comms are down. */
  noComm: './icons/swap_no_link_arrows_512.png',
  /** Coordinate-block launcher icon. */
  coordinatesCenter: './icons/pointing_center_512.png',
  /** GPS center action inside the coordinate flyout. */
  gps: '/icons/GPS_Status.svg',
} as const;

/* ------------------------------------------------------------------ */
/*  Mode selector + my-position on map                                  */
/* ------------------------------------------------------------------ */

export const PLATFORM_ICONS = {
  /** Hero image on the mode-selector splash. */
  jeepHero: '/icons/jeepM.png',
  /** Raster icon registered with MapLibre for the jeep symbol layer. */
  jeepMapImage: '/icons/123.png',
} as const;

/* ------------------------------------------------------------------ */
/*  Target card actions (PNG affordance icons)                          */
/* ------------------------------------------------------------------ */

export const TARGET_CARD_ICONS = {
  /** "Allocate" action — used in both the expanded card and the
   *  right-click context menu. */
  allocate: '/icons/targets/Target_Point.png',
  /** Destroyed-state action. */
  destroyed: '/icons/targets/x.png',
  /** `<img>.onError` fallback when a target SVG path fails to load. */
  cardFallback: '/icons/default_unknown_red.png',
} as const;
