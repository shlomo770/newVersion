import type { ReactNode } from 'react';
import styles from './MainLayout.module.css';

export interface MainLayoutProps {
  /** Full-bleed map canvas and in-map HUD (fills workspace below status bar). */
  map: ReactNode;
  /** Floating tactical panels (entity editors, mission forms, etc.). */
  overlays?: ReactNode;
  /** Optional chrome rendered above the map (compass, dimmers, confirm prompts). */
  topChrome?: ReactNode;
  /** Global status bar strip — rendered outside the map render subtree. */
  statusBar?: ReactNode;
  /** Settings / diagnostics sidebar flyout region. */
  settingsSidebar?: ReactNode;
  /** Targets dock and expanded target cards. */
  targetsPanel?: ReactNode;
  className?: string;
}

/**
 * Primary mission/training map wireframe.
 * Status bar occupies a dedicated grid row; the workspace (map + overlays) is isolated below.
 */
export function MainLayout({
  map,
  overlays,
  topChrome,
  statusBar,
  settingsSidebar,
  targetsPanel,
  className = '',
}: MainLayoutProps) {
  const rootClass = className ? `${styles.root} ${className}` : styles.root;

  return (
    <div className={rootClass} data-layout="main">
      {statusBar ? (
        <header className={styles.statusBarSlot} data-layer="status-bar">
          {statusBar}
        </header>
      ) : null}
      <div className={styles.workspace} data-layer="workspace">
        <div className={styles.mapLayer} data-layer="map">
          {map}
        </div>
        {topChrome ? (
          <div className={styles.topChromeLayer} data-layer="top-chrome">
            {topChrome}
          </div>
        ) : null}
        {settingsSidebar ? (
          <div className={styles.sidebarLayer} data-layer="settings-sidebar">
            {settingsSidebar}
          </div>
        ) : null}
        {targetsPanel ? (
          <div className={styles.targetsLayer} data-layer="targets">
            {targetsPanel}
          </div>
        ) : null}
        {overlays ? (
          <div className={styles.overlayLayer} data-layer="overlays">
            {overlays}
          </div>
        ) : null}
      </div>
    </div>
  );
}
