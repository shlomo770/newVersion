import { he } from '@shared/i18n';

/** Status-bar coordinate center flyout — two icon actions only. */
export const COORDINATE_CENTER_UI = {
  menuOffsetTopPx: he.statusBar.coordinateCenter.menuOffsetTopPx,
  gps: he.statusBar.coordinateCenter.gps,
  display: he.statusBar.coordinateCenter.display,
  coordsInputAriaLabel: he.statusBar.coordinateCenter.coordsInputAriaLabel,
} as const;
