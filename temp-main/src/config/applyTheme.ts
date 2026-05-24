import { theme, type ThemeConfig } from './theme.config';
import { form } from './form.config';

type CssVarMap = Record<string, string | number>;

/**
 * Flattens the theme config into CSS custom properties on `:root`.
 * Legacy variable names (--color-surface-panel, etc.) are preserved for existing CSS modules.
 */
export function buildThemeCssVars(config: ThemeConfig = theme): CssVarMap {
  const { colors, radius, spacing, shadow, fontSize, fontFamily, zIndex, layout, motion, components, mode } =
    config;

  return {
    'color-scheme': mode,

    /* ── Semantic theme API (theme.colors.*) ── */
    '--theme-color-primary': colors.primary,
    '--theme-color-primary-hover': colors.primaryHover,
    '--theme-color-primary-muted': colors.primaryMuted,
    '--theme-color-accent': colors.accent,
    '--theme-color-accent-muted': colors.accentMuted,
    '--theme-color-danger': colors.danger,
    '--theme-color-danger-hover': colors.dangerHover,
    '--theme-color-success': colors.success,
    '--theme-color-success-hover': colors.successHover,
    '--theme-color-warning': colors.warning,
    '--theme-color-info': colors.info,

    '--theme-color-bg-app': colors.background.app,
    '--theme-color-bg-panel': colors.background.panel,
    '--theme-color-bg-panel-header': colors.background.panelHeader,
    '--theme-color-bg-panel-translucent': colors.background.panelTranslucent,
    '--theme-color-bg-input': colors.background.input,
    '--theme-color-bg-overlay': colors.background.overlay,
    '--theme-color-bg-splash': colors.background.splash,
    '--theme-color-bg-rail': colors.background.rail,
    '--theme-color-bg-card': colors.background.card,
    '--theme-color-bg-card-hover': colors.background.cardHover,
    '--theme-color-bg-elevated': colors.background.elevated,

    '--theme-color-text-primary': colors.text.primary,
    '--theme-color-text-secondary': colors.text.secondary,
    '--theme-color-text-muted': colors.text.muted,
    '--theme-color-text-inverse': colors.text.inverse,
    '--theme-color-text-accent': colors.text.accent,
    '--theme-color-text-danger': colors.text.danger,
    '--theme-color-text-label': colors.text.label,

    '--theme-color-border': colors.border.default,
    '--theme-color-border-subtle': colors.border.subtle,
    '--theme-color-border-strong': colors.border.strong,
    '--theme-color-border-focus': colors.border.focus,
    '--theme-color-border-active': colors.border.active,

    '--theme-radius-sm': radius.sm,
    '--theme-radius-md': radius.md,
    '--theme-radius-lg': radius.lg,
    '--theme-radius-xl': radius.xl,
    '--theme-radius-full': radius.full,

    '--theme-spacing-panel-padding': spacing.panelPadding,
    '--theme-spacing-panel-padding-sm': spacing.panelPaddingSm,
    '--theme-spacing-panel-gap': spacing.panelGap,
    '--theme-spacing-form-gap': spacing.formGap,
    '--theme-spacing-section-gap': spacing.sectionGap,

    '--theme-shadow-sm': shadow.sm,
    '--theme-shadow-md': shadow.md,
    '--theme-shadow-lg': shadow.lg,
    '--theme-shadow-panel': shadow.panel,
    '--theme-shadow-modal': shadow.modal,
    '--theme-shadow-floating': shadow.floating,

    '--theme-font-size-xs': fontSize.xs,
    '--theme-font-size-sm': fontSize.sm,
    '--theme-font-size-md': fontSize.md,
    '--theme-font-size-lg': fontSize.lg,
    '--theme-font-size-xl': fontSize.xl,

    '--theme-font-family-sans': fontFamily.sans,
    '--theme-font-family-mono': fontFamily.mono,

    /* ── Legacy aliases (existing CSS modules) ── */
    '--color-brand-primary': colors.accent,
    '--color-brand-primary-muted': colors.accentMuted,
    '--color-brand-accent': colors.primary,
    '--color-brand-indigo': colors.semantic.indigo,

    '--color-white': colors.semantic.white,
    '--color-yellow': colors.semantic.yellow,
    '--color-blue': colors.semantic.blue,
    '--color-orange': colors.semantic.orange,
    '--color-red': colors.semantic.red,
    '--color-gray': colors.semantic.gray,
    '--color-green': colors.semantic.green,
    '--color-amber-focus': colors.border.focus,

    '--color-surface-panel': colors.background.panel,
    '--color-surface-panel-translucent': colors.background.panelTranslucent,
    '--color-surface-dark': colors.background.app,
    '--color-surface-zinc-900': colors.background.elevated,
    '--color-surface-zinc-950': '#09090b',
    '--color-surface-input-dark': colors.background.input,
    '--color-border-panel': colors.border.default,
    '--color-border-zinc': colors.border.subtle,
    '--color-text-primary': colors.text.primary,
    '--color-text-muted': colors.text.muted,

    '--color-splash-bg-from': colors.background.splash,
    '--color-splash-bg-via': colors.background.splash,
    '--color-splash-bg-to': colors.background.splash,
    '--color-splash-title': colors.text.primary,

    '--color-status-ok': colors.status.ok,
    '--color-status-warning': colors.status.warning,
    '--color-status-fail': colors.status.fail,
    '--color-status-connected': colors.status.connected,
    '--color-status-disconnected': colors.status.disconnected,

    '--color-map-hud': colors.map.hud,
    '--color-map-hud-muted': colors.map.hudMuted,
    '--color-map-context-menu': colors.map.contextMenu,
    '--color-map-hostile': colors.map.hostile,
    '--color-map-friendly': colors.map.friendly,

    '--space-panel-padding': spacing.panelPadding,
    '--space-panel-gap': spacing.panelGap,
    '--space-form-gap': spacing.formGap,

    '--layout-status-bar-height': layout.statusBarHeight,
    '--layout-sidebar-offset': layout.sidebarPanelWidth,
    '--layout-entity-panel-width': layout.entityPanelWidth,
    '--layout-sidebar-rail-width': layout.sidebarRailWidth,
    '--layout-map-action-dock-top': layout.mapActionDockTop,
    '--layout-map-action-dock-left': layout.mapActionDockLeft,
    '--layout-radius-sm': radius.sm,
    '--layout-radius-md': radius.md,
    '--layout-radius-lg': radius.lg,
    '--layout-radius-xl': radius.xl,

    '--font-family-sans': fontFamily.sans,
    '--font-family-mono': fontFamily.mono,
    '--font-size-status-bar': fontSize.statusBar,
    '--font-size-map-hud': fontSize.mapHud,

    '--shadow-panel': shadow.panel,
    '--shadow-modal': shadow.modal,
    '--shadow-floating': shadow.floating,

    '--z-map-base': zIndex.mapBase,
    '--z-map-canvas-decoration': 10,
    '--z-map-hud': zIndex.mapHud,
    '--z-map-measure-badge': zIndex.mapMeasureBadge,
    '--z-map-context-menu': zIndex.mapContextMenu,
    '--z-target-panel': zIndex.targetPanel,
    '--z-compass-widget': zIndex.compass,
    '--z-floating-chrome': zIndex.floatingChrome,
    '--z-entity-panel': zIndex.entityPanel,
    '--z-entity-sidebar-flyout': zIndex.entityPanel,
    '--z-modal-backdrop': zIndex.modalBackdrop,
    '--z-confirm-dialog': zIndex.confirmDialog,
    '--z-status-bar': zIndex.statusBar,
    '--z-toast': zIndex.toast,
    '--z-flyout-menu': zIndex.flyoutMenu,
    '--z-map-top-chrome': zIndex.mapTopChrome,
    '--z-sidebar-rail': zIndex.sidebarRail,
    '--z-sidebar-panel': zIndex.sidebarPanel,

    '--duration-fast': motion.fast,
    '--duration-normal': motion.normal,
    '--duration-slow': motion.slow,
    '--ease-default': motion.ease,

    '--component-button-height-sm': components.button.heightSm,
    '--component-button-height-md': components.button.heightMd,
    '--component-button-height-lg': components.button.heightLg,
    '--component-input-height': components.input.height,
    '--component-input-height-sm': components.input.heightSm,
    '--modal-scrim-opacity': components.modal.scrimOpacity,
    '--modal-blur': components.modal.blur,

    /* ── Form design system (form.config.ts) ── */
    '--form-stack-gap': form.stackGap,
    '--form-field-gap': form.fieldGap,
    '--form-actions-gap': form.actionsGap,
    '--form-label-size': form.label.fontSize,
    '--form-label-weight': form.label.fontWeight,
    '--form-control-font-size': form.control.fontSize,
    '--form-control-font-size-compact': form.control.fontSizeCompact,
    '--form-control-min-height': form.control.minHeight,
    '--form-control-min-height-compact': form.control.minHeightCompact,
    '--form-control-padding-x': form.control.paddingX,
    '--form-control-padding-y': form.control.paddingY,
    '--form-control-padding-x-compact': form.control.paddingXCompact,
    '--form-control-padding-y-compact': form.control.paddingYCompact,
    '--form-control-radius': form.control.radius,
    '--form-control-focus-ring': form.control.focusRingWidth,
    '--form-button-font-size-sm': form.button.fontSizeSm,
    '--form-button-font-size-md': form.button.fontSizeMd,
    '--form-button-font-size-lg': form.button.fontSizeLg,
    '--form-section-padding': form.section.padding,
    '--form-section-radius': form.section.radius,
    '--form-section-gap': form.section.gap,
  };
}

/** Applies theme CSS variables to the document root. Safe to call multiple times. */
export function applyTheme(config: ThemeConfig = theme, root: HTMLElement = document.documentElement): void {
  const vars = buildThemeCssVars(config);
  for (const [key, value] of Object.entries(vars)) {
    if (key === 'color-scheme') {
      root.style.colorScheme = String(value);
    } else {
      root.style.setProperty(key, String(value));
    }
  }
  root.dataset.theme = config.mode;
}
