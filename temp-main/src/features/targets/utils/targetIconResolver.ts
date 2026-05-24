import { TargetType } from '@domain/enums/target.enum';
import type { Target } from '../store/targetsSlice';
import {
  KNOWN_TARGET_ICON_TYPES,
  type KnownTargetIconType,
  TARGET_FALLBACK_ICON_TYPE,
  TARGET_ICON_PUBLIC_DIR,
  TARGET_ICON_RELATIVE_DIR,
  TARGET_ICON_VARIANT_SEPARATOR,
  TARGET_ICON_VARIANTS,
  TARGET_PRELOAD_ICON_IDS,
  type TargetIconVariant,
} from '../config';

/**
 * Target icon resolver.
 *
 * Reads everything from `targetIcons.config.ts` — never hardcode a
 * type, variant, or path here. Same module powers the target cards
 * (`getTargetIcon` returns the SVG path) and the MapLibre symbol layer
 * (`getTargetIconIdFromTarget` returns the `${base}_${variant}` id).
 */

/** Normalize a server-side `platform` / typed target type to one of the
 *  known SVG basenames. Unknown values collapse to the fallback type. */
export function normalizeTargetIconType(
  type: string | undefined,
): KnownTargetIconType {
  const raw = (type ?? '').trim();
  if (!raw) return TARGET_FALLBACK_ICON_TYPE;

  if ((KNOWN_TARGET_ICON_TYPES as readonly string[]).includes(raw)) {
    return raw as KnownTargetIconType;
  }

  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    const enumName = TargetType[numeric as TargetType];
    if (
      typeof enumName === 'string' &&
      (KNOWN_TARGET_ICON_TYPES as readonly string[]).includes(enumName)
    ) {
      return enumName as KnownTargetIconType;
    }
  }

  return TARGET_FALLBACK_ICON_TYPE;
}

/** MapLibre image id base — same basename as the SVG file without
 *  extension. The faction-suffixed id is built by
 *  `getTargetIconIdFromTarget` below. */
export function getTargetIconId(type: string | undefined): string {
  return normalizeTargetIconType(type);
}

/** Card/list relative path (`<img src="…">`). */
export function getTargetIconRelativePath(type: string | undefined): string {
  return `${TARGET_ICON_RELATIVE_DIR}/${getTargetIconId(type)}.svg`;
}

/** Card/list img src — kept as an alias for components that used to
 *  call a local `getTargetIcon()`. */
export function getTargetIcon(type: string | undefined): string {
  return getTargetIconRelativePath(type);
}

/** Public path used by `fetch()` inside the rasterizer. */
export function getTargetIconPublicPath(type: string | undefined): string {
  return `${TARGET_ICON_PUBLIC_DIR}/${getTargetIconId(type)}.svg`;
}

/** Faction variant for a given target. `friend === true` → friendly,
 *  `friend === false` → hostile, anything else → unknown. */
export function getTargetIconVariant(target: Pick<Target, 'friend'>): TargetIconVariant {
  if (target.friend === true) return 'friendly';
  if (target.friend === false) return 'hostile';
  return 'unknown';
}

/** Full MapLibre symbol-layer icon id with the friend/foe suffix. */
export function getTargetIconIdFromTarget(
  target: Pick<Target, 'type' | 'friend'>,
): string {
  const base = getTargetIconId(target.type);
  const variant = getTargetIconVariant(target);
  return `${base}${TARGET_ICON_VARIANT_SEPARATOR}${variant}`;
}

/** Strip the variant suffix to find the source SVG basename. */
export function getTargetIconBaseType(iconId: string): string {
  for (const variant of TARGET_ICON_VARIANTS) {
    const suffix = `${TARGET_ICON_VARIANT_SEPARATOR}${variant}`;
    if (iconId.endsWith(suffix)) return iconId.slice(0, -suffix.length);
  }
  return iconId;
}

/** SVG filename for a given target type — used by external diagnostics. */
export function getTargetIconSvgFilename(type: string | undefined): string {
  return `${getTargetIconId(type)}.svg`;
}

/* Re-export the config-owned constants so existing call sites that
 * pulled them from the resolver keep working. */
export {
  KNOWN_TARGET_ICON_TYPES,
  type KnownTargetIconType,
  TARGET_ICON_VARIANTS,
  type TargetIconVariant,
  TARGET_PRELOAD_ICON_IDS as MAP_PRELOAD_TARGET_ICON_IDS,
};
