/**
 * App-global configuration entrypoint.
 *
 * Only TRULY app-wide concerns live in `src/config/` — design tokens
 * (theme), the runtime CSS-var applier, and the global UI icon
 * registry. Feature-specific configuration lives next to the feature
 * that owns it:
 *
 *   src/features/map/config/     — map layer ids, paint, viewport
 *                                  defaults, timers, toolbar
 *   src/features/targets/config/ — target icon mapping, visibility
 *                                  defaults, status labels, overlay
 *                                  layout, runtime throttles
 *
 * Importing feature config from app-level code is fine via the
 * feature's `@features/<name>/config` barrel.
 */

export { theme, type ThemeConfig, type ThemeMode } from './theme.config';
export { form, type FormConfig } from './form.config';
export { applyTheme, buildThemeCssVars } from './applyTheme';
export {
  MAP_TOOL_ICONS,
  ENTITIES_SIDEBAR_ICONS,
  STATUS_BAR_ICONS,
  PLATFORM_ICONS,
  TARGET_CARD_ICONS,
} from './appIcons.config';
