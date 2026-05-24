import type { Map as MaplibreMap } from 'maplibre-gl';
import {
  KNOWN_TARGET_ICON_TYPES,
  TARGET_DESTROYED_ICON_ID,
  TARGET_DESTROYED_X_DRAW,
  TARGET_FACTION_COLORS,
  TARGET_ICON_FALLBACK,
  TARGET_ICON_RASTER,
  TARGET_ICON_VARIANTS,
  TARGET_ICON_VARIANT_SEPARATOR,
  TARGET_PRELOAD_ICON_IDS,
  TARGET_SVG_ORIGINAL_FILL_RE,
  type TargetIconVariant,
} from '@features/targets/config';
import { getTargetIconPublicPath } from '@features/targets/utils/targetIconResolver';

/** Recolor target for the white halo silhouette stamps. */
const HALO_RECOLOR_TARGET = '#ffffff';

/**
 * SVG → ImageData rasterizer for the MapLibre target symbol layer.
 *
 * Pulls every tunable from `@features/targets/config/targetIcons.config.ts`
 * — no magic numbers, no hardcoded colors, no hardcoded paths.
 *
 * The cards render the raw SVGs directly from `<img src="…">`. Here we
 * decode them, recolor the silhouette to the faction color, stamp a
 * white halo around it for contrast on any basemap, and hand the
 * resulting `ImageData` to MapLibre via `map.addImage()`.
 */

const svgTextCache = new Map<string, Promise<string>>();
const renderedImageCache = new Map<string, Promise<ImageData | null>>();

function isPlaceholderImage(map: MaplibreMap, iconId: string): boolean {
  try {
    const img = map.getImage(iconId);
    if (!img) return false;
    const data = img.data as unknown as { width?: number; height?: number };
    if (!data) return false;
    return (data.width ?? 0) <= 1 && (data.height ?? 0) <= 1;
  } catch {
    return false;
  }
}

function removeMapImageIfPresent(map: MaplibreMap, iconId: string): void {
  try {
    if (map.hasImage(iconId)) map.removeImage(iconId);
  } catch {
    /* ignore */
  }
}

function fetchSvgText(baseType: string): Promise<string> {
  const existing = svgTextCache.get(baseType);
  if (existing) return existing;
  const url = getTargetIconPublicPath(baseType);
  const promise = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return res.text();
    })
    .catch(() => {
      /* Fallback path will draw a colored disc instead. */
      return '';
    });
  svgTextCache.set(baseType, promise);
  return promise;
}

function recolorSvgFill(svgText: string, color: string): string {
  if (!svgText) return svgText;
  return svgText.replace(TARGET_SVG_ORIGINAL_FILL_RE, color);
}

function svgToImage(svgText: string): Promise<HTMLImageElement | null> {
  if (!svgText) return Promise.resolve(null);
  return new Promise((resolve) => {
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Draws the platform silhouette with a thin white halo behind it. The
 * silhouette itself carries the faction color so the icon shape on the
 * map matches the cards exactly.
 *
 * Halo trick: stamp the WHITE-recolored SVG 8 times around the target
 * position to build an offset outline, then stamp the colored SVG once
 * at the target position so the silhouette sits crisply on top.
 */
function drawSilhouetteWithHalo(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  whiteImg: HTMLImageElement | null,
  inner: number,
  inset: number,
): void {
  if (!img && !whiteImg) return;
  if (whiteImg) {
    const r = TARGET_ICON_RASTER.haloRadiusPx;
    for (let dx = -r; dx <= r; dx += r) {
      for (let dy = -r; dy <= r; dy += r) {
        if (dx === 0 && dy === 0) continue;
        ctx.drawImage(whiteImg, inset + dx, inset + dy, inner, inner);
      }
    }
  }
  if (img) {
    ctx.drawImage(img, inset, inset, inner, inner);
  }
}

function drawDestroyedX(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
): void {
  const {
    outerStrokeColor,
    outerLineWidthMinPx,
    outerLineWidthRatio,
    innerStrokeColor,
    innerLineWidthMinPx,
    innerLineWidthRatio,
    armRadiusRatio,
  } = TARGET_DESTROYED_X_DRAW;

  const r = size * armRadiusRatio;
  ctx.lineCap = 'round';

  ctx.strokeStyle = outerStrokeColor;
  ctx.lineWidth = Math.max(outerLineWidthMinPx, size * outerLineWidthRatio);
  ctx.beginPath();
  ctx.moveTo(cx - r, cy - r);
  ctx.lineTo(cx + r, cy + r);
  ctx.moveTo(cx + r, cy - r);
  ctx.lineTo(cx - r, cy + r);
  ctx.stroke();

  ctx.strokeStyle = innerStrokeColor;
  ctx.lineWidth = Math.max(innerLineWidthMinPx, size * innerLineWidthRatio);
  ctx.beginPath();
  ctx.moveTo(cx - r, cy - r);
  ctx.lineTo(cx + r, cy + r);
  ctx.moveTo(cx + r, cy - r);
  ctx.lineTo(cx - r, cy + r);
  ctx.stroke();
}

async function renderTargetIcon(iconId: string): Promise<ImageData | null> {
  const size = TARGET_ICON_RASTER.sizePx;
  const inset = TARGET_ICON_RASTER.insetPx;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;

  if (iconId === TARGET_DESTROYED_ICON_ID) {
    drawDestroyedX(ctx, cx, cy, size);
    try {
      return ctx.getImageData(0, 0, size, size);
    } catch {
      return null;
    }
  }

  /* Split iconId "<baseType><sep><variant>". */
  const sep = TARGET_ICON_VARIANT_SEPARATOR;
  const lastSep = iconId.lastIndexOf(sep);
  const baseType = lastSep >= 0 ? iconId.slice(0, lastSep) : iconId;
  const variant = (lastSep >= 0 ? iconId.slice(lastSep + sep.length) : 'unknown') as TargetIconVariant;
  const color = TARGET_FACTION_COLORS[variant] ?? TARGET_FACTION_COLORS.unknown;

  const rawSvg = await fetchSvgText(baseType);
  if (!rawSvg) {
    /* Fallback — small faction-colored disc with a white outline.
     * Keeps the target visible even when the SVG can't be loaded. */
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, size * TARGET_ICON_FALLBACK.radiusRatio, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = HALO_RECOLOR_TARGET;
    ctx.lineWidth = TARGET_ICON_FALLBACK.outlineWidthPx;
    ctx.stroke();
    try {
      return ctx.getImageData(0, 0, size, size);
    } catch {
      return null;
    }
  }

  const [coloredImg, whiteImg] = await Promise.all([
    svgToImage(recolorSvgFill(rawSvg, color)),
    svgToImage(recolorSvgFill(rawSvg, HALO_RECOLOR_TARGET)),
  ]);

  const inner = size - inset * 2;
  drawSilhouetteWithHalo(ctx, coloredImg, whiteImg, inner, inset);

  try {
    return ctx.getImageData(0, 0, size, size);
  } catch {
    return null;
  }
}

function getOrRenderIconImageData(iconId: string): Promise<ImageData | null> {
  const existing = renderedImageCache.get(iconId);
  if (existing) return existing;
  const promise = renderTargetIcon(iconId);
  renderedImageCache.set(iconId, promise);
  return promise;
}

async function addIconToMap(map: MaplibreMap, iconId: string): Promise<boolean> {
  if (map.hasImage(iconId) && !isPlaceholderImage(map, iconId)) return true;
  removeMapImageIfPresent(map, iconId);

  const imageData = await getOrRenderIconImageData(iconId);
  if (!imageData) return false;

  try {
    map.addImage(iconId, imageData, { pixelRatio: TARGET_ICON_RASTER.pixelRatio });
    return true;
  } catch {
    return map.hasImage(iconId) && !isPlaceholderImage(map, iconId);
  }
}

/**
 * Load every known target icon into the map and resolve once they're
 * all registered. Safe to call multiple times — cached and idempotent.
 */
export async function loadAllTargetIcons(map: MaplibreMap): Promise<{
  total: number;
  loaded: number;
  missing: string[];
}> {
  const results = await Promise.all(
    TARGET_PRELOAD_ICON_IDS.map(async (id) => ({ id, ok: await addIconToMap(map, id) })),
  );
  const missing = results.filter((r) => !r.ok).map((r) => r.id);
  const loaded = results.filter((r) => r.ok).length;
  return { total: results.length, loaded, missing };
}

/** Used by the styleimagemissing event handler in TargetsLayer. */
export async function loadTargetIconIntoMap(
  map: MaplibreMap,
  iconId: string,
): Promise<boolean> {
  return addIconToMap(map, iconId);
}

export function isTargetIconId(iconId: string): boolean {
  if (!iconId) return false;
  if (iconId === TARGET_DESTROYED_ICON_ID) return true;
  return TARGET_PRELOAD_ICON_IDS.includes(iconId);
}

export function isTargetIconReady(map: MaplibreMap, iconId: string): boolean {
  return map.hasImage(iconId) && !isPlaceholderImage(map, iconId);
}

export { TARGET_PRELOAD_ICON_IDS, KNOWN_TARGET_ICON_TYPES, TARGET_ICON_VARIANTS };
