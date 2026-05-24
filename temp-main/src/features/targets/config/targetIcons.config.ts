/**
 * Target icon configuration — the single source of truth for everything
 * the icon pipeline cares about. Both the target cards and the MapLibre
 * symbol layer resolve icons through `targetIconResolver` which in turn
 * reads from this file. No icon mapping lives anywhere else.
 *
 * When adding a new target SVG:
 *   1. Drop the SVG at `public/icons/targets/<basename>.svg`.
 *   2. Add `<basename>` to `KNOWN_TARGET_ICON_TYPES` below.
 *   3. Everything else (preload list, friendly/hostile/unknown variants,
 *      fallback handling) updates automatically.
 */

/* ------------------------------------------------------------------ */
/*  Paths                                                              */
/* ------------------------------------------------------------------ */

/** Public path prefix for the raw SVG silhouettes. */
export const TARGET_ICON_PUBLIC_DIR = '/icons/targets';
/** Relative path the cards use as an `<img src="…">` attribute. */
export const TARGET_ICON_RELATIVE_DIR = 'icons/targets';

/* ------------------------------------------------------------------ */
/*  Known icon types + faction variants                                 */
/* ------------------------------------------------------------------ */

/** Base SVG basenames that exist under `TARGET_ICON_PUBLIC_DIR/`.
 *  Same set used by both `TargetCardCompact/Expanded` and the MapLibre
 *  symbol layer — no duplicate list anywhere else. */
export const KNOWN_TARGET_ICON_TYPES = [
  'airplaneLarge',
  'airplaneMedium',
  'droneLarge',
  'droneMedium',
  'uav',
  'unknown',
] as const;

export type KnownTargetIconType = (typeof KNOWN_TARGET_ICON_TYPES)[number];

/** Icon ID used when a target's `type` cannot be normalized. Must be one
 *  of `KNOWN_TARGET_ICON_TYPES` so the corresponding SVG exists. */
export const TARGET_FALLBACK_ICON_TYPE: KnownTargetIconType = 'unknown';

/** Friend/foe variants. The MapLibre icon id is `${baseType}${SEPARATOR}${variant}`
 *  so the same silhouette can be tinted differently per faction. */
export const TARGET_ICON_VARIANTS = ['friendly', 'hostile', 'unknown'] as const;
export type TargetIconVariant = (typeof TARGET_ICON_VARIANTS)[number];

/** Separator between basename and variant in the MapLibre icon id. */
export const TARGET_ICON_VARIANT_SEPARATOR = '_';

/** Special icon id used for destroyed targets (procedurally drawn X,
 *  doesn't follow the basename_variant pattern). */
export const TARGET_DESTROYED_ICON_ID = 'x-icon';

/* ------------------------------------------------------------------ */
/*  Faction silhouette colors                                           */
/* ------------------------------------------------------------------ */

/** Each silhouette is recolored to its faction color during rasterization
 *  so the platform shape itself carries the friend/foe semantics. */
export const TARGET_FACTION_COLORS: Record<TargetIconVariant, string> = {
  friendly: '#16a34a',
  hostile: '#dc2626',
  unknown: '#eab308',
} as const;

/* ------------------------------------------------------------------ */
/*  Rasterization tuning                                                */
/* ------------------------------------------------------------------ */

/** SVG → ImageData pipeline tuning. */
export const TARGET_ICON_RASTER = {
  /** Canvas size in pixels — the SVG is decoded into a square this big. */
  sizePx: 96,
  /** Padding around the silhouette so `icon-rotate` doesn't clip edges. */
  insetPx: 10,
  /** Pixel ratio passed to `map.addImage(..., { pixelRatio })`. */
  pixelRatio: 2,
  /** Halo radius for the white outline drawn behind the silhouette. */
  haloRadiusPx: 3,
} as const;

/** Fallback geometry when an SVG fetch/decode fails entirely. A small
 *  faction-colored disc with a white outline keeps the target visible
 *  rather than ever falling back to a generic red placeholder. */
export const TARGET_ICON_FALLBACK = {
  /** Disc radius as a fraction of the raster size. */
  radiusRatio: 0.3,
  /** White outline width in pixels. */
  outlineWidthPx: 4,
} as const;

/** Regex matching the raw silhouette fill in shipped SVGs. The recolor
 *  step swaps these for the faction color before rasterization. */
export const TARGET_SVG_ORIGINAL_FILL_RE = /#f7f7f7|#fff(?:fff)?(?![\w-])/gi;

/* ------------------------------------------------------------------ */
/*  Preload list (derived)                                              */
/* ------------------------------------------------------------------ */

/** Every icon id the MapLibre symbol layer might reference. Computed
 *  from KNOWN_TARGET_ICON_TYPES × TARGET_ICON_VARIANTS, plus the
 *  destroyed-X. The layer code preloads all of these before adding
 *  the symbol layer so MapLibre's placement loop cannot crash on a
 *  missing icon. */
export const TARGET_PRELOAD_ICON_IDS: readonly string[] = [
  ...KNOWN_TARGET_ICON_TYPES.flatMap((type) =>
    TARGET_ICON_VARIANTS.map(
      (variant) => `${type}${TARGET_ICON_VARIANT_SEPARATOR}${variant}`,
    ),
  ),
  TARGET_DESTROYED_ICON_ID,
];
