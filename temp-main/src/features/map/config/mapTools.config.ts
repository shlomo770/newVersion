/**
 * Map toolbar / filter menu configuration.
 *
 * The visual layout of the FAB-launched flyout (top/left offsets) lives
 * in `MAP_TOOLBAR_FLYOUT`. The CONTENTS of the target filter sub-menu
 * are described declaratively in `TARGET_FILTER_ITEMS` — each row is a
 * record of {label, icon, redux selector, toggle action}. The menu
 * component just iterates this array, so adding a new filter is one
 * record edit, no JSX changes.
 */

import type { ComponentType, SVGProps } from 'react';
import { TbRoute, TbTag } from 'react-icons/tb';
import type { RootState } from '@app/store';
import {
  toggleTargetLabelsVisible,
  toggleTargetTrailsVisible,
} from '@features/map/store/filterSlice';

/* ------------------------------------------------------------------ */
/*  Flyout offsets relative to the launcher                             */
/* ------------------------------------------------------------------ */

export const MAP_TOOLBAR_FLYOUT = {
  main: { top: 155, left: 285, arrow: 25 },
  brightness: { top: 260, left: 240, arrow: 55 },
  filter: { top: 260, left: 240, arrow: 55 },
} as const;

export const MAP_TOOLBAR_MENU = {
  minWidthPx: 200,
} as const;

/* ------------------------------------------------------------------ */
/*  Filter menu rows (config-driven)                                    */
/* ------------------------------------------------------------------ */

/** Icon glyph used by a filter row — anything that renders given an
 *  `{ size }` prop (Tabler icons, hand-rolled SVG components, etc.). */
export type FilterItemIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

/** Action creator the menu dispatches when the user toggles a row. */
export type FilterItemToggleAction = () => { type: string };

/** Declarative description of one row in the target filter sub-menu. */
export interface TargetFilterItem {
  /** Stable id used as React key + aria identification. */
  id: 'trails' | 'labels';
  /** Localized label rendered next to the toggle. */
  label: string;
  /** Localized aria-label for the toggle switch. */
  ariaLabel: string;
  /** Localized tooltip for the row. */
  title: string;
  /** Icon glyph rendered on the left of the row. */
  icon: FilterItemIcon;
  /** Redux selector returning the current boolean state of this filter. */
  selector: (state: RootState) => boolean;
  /** Redux action creator to dispatch on toggle. */
  toggleAction: FilterItemToggleAction;
}

/**
 * The two independent map-element filters the user can toggle from the
 * target filter sub-menu. Order here = render order.
 *
 * Each selector includes the `?? true` HMR-safety fallback so an older
 * slice shape (left in a running Redux store across hot reloads) can't
 * crash the UI.
 */
export const TARGET_FILTER_ITEMS: readonly TargetFilterItem[] = [
  {
    id: 'trails',
    label: 'שובל מטרות',
    ariaLabel: 'Toggle target trails',
    title: 'הצג / הסתר שובלי מטרות',
    icon: TbRoute,
    selector: (s) => s.filter.targetVisibility?.trails ?? true,
    toggleAction: toggleTargetTrailsVisible,
  },
  {
    id: 'labels',
    label: 'תוויות מטרות',
    ariaLabel: 'Toggle target labels',
    title: 'הצג / הסתר תוויות מטרות',
    icon: TbTag,
    selector: (s) => s.filter.targetVisibility?.labels ?? true,
    toggleAction: toggleTargetLabelsVisible,
  },
];

/** Localized header shown at the top of the filter sub-menu panel. */
export const TARGET_FILTER_MENU_TITLE = 'סינון מטרות';
