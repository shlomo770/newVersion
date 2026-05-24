/**
 * Target status / type metadata — the single source of truth for:
 *  - which statuses are abortable (drive the on-map ABORT button),
 *  - which statuses imply "assigned" / "locked" derived flags,
 *  - the Hebrew display label for each status,
 *  - the Hebrew display label for each target type.
 *
 * All string keys reference `TargetStateString` / `KnownTargetIconType`
 * so there is no risk of typo'd status literals drifting across files.
 *
 * Components and reducers MUST import from this file rather than
 * hard-coding status string literals.
 */

import { TargetStateString } from '@domain/enums/target.enum';
import {
  KNOWN_TARGET_ICON_TYPES,
  TARGET_FALLBACK_ICON_TYPE,
  type KnownTargetIconType,
} from './targetIcons.config';

/* ------------------------------------------------------------------ */
/*  Abortable statuses                                                  */
/* ------------------------------------------------------------------ */

/**
 * Statuses for which the operator can abort an engagement. Anything
 * already aborted/destroyed/inactive is intentionally excluded.
 */
export const ABORTABLE_TARGET_STATUSES: ReadonlySet<string> = new Set<string>([
  TargetStateString.allocated,
  TargetStateString.designated,
  TargetStateString.track,
  TargetStateString.arm,
]);

/** Statuses that imply `isAssigned = true` when updating from a wire
 *  payload. */
export const ASSIGNED_STATUSES: ReadonlySet<string> = new Set<string>([
  TargetStateString.designated,
]);

/** Statuses that imply `isLocked = true` when updating from a wire
 *  payload. */
export const LOCKED_STATUSES: ReadonlySet<string> = new Set<string>([
  TargetStateString.track,
  TargetStateString.arm,
]);

/* ------------------------------------------------------------------ */
/*  Hebrew display labels                                               */
/* ------------------------------------------------------------------ */

/** Hebrew label per target status used in the target card UI. Any
 *  status not listed here renders as empty string. */
export const TARGET_STATUS_HEBREW_LABELS: Readonly<Record<string, string>> = {
  [TargetStateString.active]: 'פעיל',
  [TargetStateString.allocated]: 'בהמתנה',
  [TargetStateString.designated]: 'מוקצה',
  [TargetStateString.track]: 'נעול',
  [TargetStateString.arm]: 'תקיפה',
  [TargetStateString.destroyed]: 'הושמד',
  /** Server occasionally sends a legacy mixed-case "Abort" sentinel. */
  Abort: 'בוטל',
  /** Same for "Destroyed". */
  Destroyed: 'הושמד',
};

export function getTargetStatusHebrewLabel(status: string | undefined): string {
  if (!status) return '';
  return TARGET_STATUS_HEBREW_LABELS[status] ?? '';
}

/** Hebrew label per target type. */
export const TARGET_TYPE_HEBREW_LABELS: Readonly<Record<KnownTargetIconType, string>> = {
  airplaneLarge: 'מטוס גדול',
  airplaneMedium: 'מטוס בנוני',
  droneLarge: 'רחפן גדול',
  droneMedium: 'רחפן בנוני',
  uav: 'רחפן',
  unknown: 'לא ידוע',
};

export function getTargetTypeHebrewLabel(type: string | undefined): string {
  if (!type) return '';
  const key = (KNOWN_TARGET_ICON_TYPES as readonly string[]).includes(type)
    ? (type as KnownTargetIconType)
    : TARGET_FALLBACK_ICON_TYPE;
  return TARGET_TYPE_HEBREW_LABELS[key] ?? '';
}
