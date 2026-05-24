/**
 * Target overlay + icon-raster visual tuning.
 *
 * Two responsibilities:
 *  1. `TARGET_OVERLAY_LAYOUT` — the on-screen geometry helpers used by
 *     `abortButtonLayout.ts` to compute the abort-button screen
 *     position relative to the target anchor. The helper does pure
 *     math; ALL the constants live here.
 *  2. `TARGET_DESTROYED_X_DRAW` — the canvas-draw constants for the
 *     procedural "destroyed" X glyph (outer / inner stroke colors,
 *     line-width ratios, arm radius ratio). The icon loader does the
 *     drawing; the colors / ratios live here.
 *
 * Why split from `targetIcons.config.ts`?
 *  - `targetIcons.config.ts` answers "which SVG, which faction color,
 *    where on disk?".
 *  - This file answers "how big and how positioned on screen?".
 *  Different question, different cadence of change.
 */

/* ------------------------------------------------------------------ */
/*  Abort button on-map overlay                                         */
/* ------------------------------------------------------------------ */

export const TARGET_OVERLAY_LAYOUT = {
  /** Rendered abort button dimensions (must roughly match the AppButton
   *  size="sm" footprint — used to set the absolute wrapper width). */
  abortButtonWidthPx: 52,
  abortButtonHeightPx: 30,

  /** Vertical gap between the bottom of the target label and the top
   *  of the abort button. */
  buttonGapBelowLabelPx: 20,

  /** Radius (px) of the red/yellow status ring drawn around the icon. */
  statusRingRadiusPx: 16,

  /** Base icon diameter (px) before zoom scaling. The actual on-screen
   *  size is `iconBaseDiameterPx * scale-for-current-zoom`. */
  iconBaseDiameterPx: 64,

  /**
   * Discrete icon-scale ramp keyed off `map.getZoom()`. Mirrors the
   * shape of `TARGET_ICON_SIZE_BY_ZOOM` in `mapVisuals.config.ts` —
   * keep these two in sync if either ever changes.
   *
   * `iconScaleByZoom(zoom)` returns the multiplier to apply to
   * `iconBaseDiameterPx`.
   */
  zoomScaleStops: [
    { maxZoom: 6, scale: 0.55 },
    { maxZoom: 10, scale: 0.75 },
    { maxZoom: 14, scale: 0.95 },
    { maxZoom: Infinity, scale: 1.1 },
  ] as const,

  /** Label rendering assumptions used to estimate label footprint. */
  label: {
    textSizePx: 12,
    /** Vertical offset from the icon bottom in `em` units (matches
     *  the MapLibre `text-offset` y-component for the targets label
     *  layer). */
    offsetEm: 1.6,
    /** Max number of lines drawn in the multi-line target label. */
    maxLines: 2,
    /** Line-height multiplier applied to `textSizePx`. */
    lineHeightRatio: 1.2,
  } as const,
} as const;

/** Pure helper — returns the icon-scale multiplier for a given map zoom. */
export function targetIconScaleForZoom(zoom: number): number {
  for (const stop of TARGET_OVERLAY_LAYOUT.zoomScaleStops) {
    if (zoom <= stop.maxZoom) return stop.scale;
  }
  return TARGET_OVERLAY_LAYOUT.zoomScaleStops[
    TARGET_OVERLAY_LAYOUT.zoomScaleStops.length - 1
  ].scale;
}

/* ------------------------------------------------------------------ */
/*  Destroyed-X procedural draw                                         */
/* ------------------------------------------------------------------ */

export const TARGET_DESTROYED_X_DRAW = {
  /** Outer (thicker) stroke layer. */
  outerStrokeColor: '#ffffff',
  /** Outer stroke width = `max(outerLineWidthMinPx, size * outerLineWidthRatio)`. */
  outerLineWidthMinPx: 4,
  outerLineWidthRatio: 0.16,

  /** Inner (thinner) stroke layer drawn on top of the outer. */
  innerStrokeColor: '#111111',
  innerLineWidthMinPx: 3,
  innerLineWidthRatio: 0.12,

  /** Arm radius — distance from the X center to each diagonal endpoint,
   *  as a fraction of the icon size. */
  armRadiusRatio: 0.42,
} as const;
