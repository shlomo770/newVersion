/**
 * Default values for everything the user can toggle in the target
 * filter UI. The Redux filter slice derives its initial state from
 * these so changing a default in production only requires editing this
 * file — no slice/component edits.
 */

/** Default visibility of independent target sub-layers. */
export const TARGET_VISIBILITY_DEFAULTS = {
  /** Show the moving target trail polylines under each icon. */
  trails: true,
  /** Show the id/range/altitude text label next to each icon. */
  labels: true,
  /** Show the right-side target cards panel. */
  panel: true,
} as const;

/** Default target-type filter — friendly/hostile/unknown all visible. */
export const TARGET_TYPE_DEFAULTS = {
  all: true,
  friendly: true,
  hostile: true,
  unknown: true,
} as const;
