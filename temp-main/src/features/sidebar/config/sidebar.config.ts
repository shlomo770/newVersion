import type { PanelType } from '@/types';

/**
 * Sidebar panels that keep the hamburger chrome open while the user interacts
 * with the map (e.g. picking coordinates for manual location entry).
 */
export const SIDEBAR_PANELS_MAP_CLICK_PASSTHROUGH: readonly Exclude<PanelType, null>[] = [
  'location',
] as const;

export function shouldKeepSidebarOpenOnMapClick(activePanel: PanelType): boolean {
  if (!activePanel) return false;
  return SIDEBAR_PANELS_MAP_CLICK_PASSTHROUGH.includes(activePanel);
}
