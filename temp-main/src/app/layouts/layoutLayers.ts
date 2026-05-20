/**
 * Canonical z-index layering for viewport shells and page overlays.
 * Values reference design tokens from `src/app/styles/variables.css`.
 */
export const LayoutZIndex = {
  mapBase: 'var(--z-map-base)',
  mapHud: 'var(--z-map-hud)',
  mapContextMenu: 'var(--z-map-context-menu)',
  mapMeasureBadge: 'var(--z-map-measure-badge)',
  targetPanel: 'var(--z-target-panel)',
  entityPanel: 'var(--z-entity-panel)',
  entitySidebarFlyout: 'var(--z-entity-sidebar-flyout)',
  floatingChrome: 'var(--z-floating-chrome)',
  compassWidget: 'var(--z-compass-widget)',
  confirmDialog: 'var(--z-confirm-dialog)',
  modalBackdrop: 'var(--z-modal-backdrop)',
  statusBar: 'var(--z-status-bar)',
  toast: 'var(--z-toast)',
  flyoutMenu: 'var(--z-flyout-menu)',
  mapTopChrome: 'var(--z-map-top-chrome)',
} as const;

export type LayoutZIndexKey = keyof typeof LayoutZIndex;
