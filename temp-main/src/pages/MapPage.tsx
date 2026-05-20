import { useCallback, useMemo, useRef } from 'react';
import MapPageContainer from './MapPageContainer';
import { ErrorBoundary } from '@shared/components';
import { SidebarContainer } from '@features/sidebar';
import { TargetPanel } from '@features/targets';
import { StatusBar } from '@features/status-bar';
import { AppShell, MainLayout } from '@app/layouts';
import { useMapPageSession } from './hooks/useMapPageSession';

/**
 * Mission / training map view: composes layout shells with existing feature UI.
 * StatusBar is mounted at the layout root — outside the map canvas subtree.
 */
export function MapPage() {
  const session = useMapPageSession();
  const mapSiderToggleRef = useRef<(() => void) | null>(null);

  const handleStatusBarMenu = useCallback(() => {
    session.toggleSidebar();
    mapSiderToggleRef.current?.();
  }, [session.toggleSidebar]);

  const registerMapSiderToggle = useCallback((toggle: () => void) => {
    mapSiderToggleRef.current = toggle;
  }, []);

  const statusBar = useMemo(
    () => <StatusBar onMenuClick={handleStatusBarMenu} mapServiceRef={session.mapServiceRef} />,
    [handleStatusBarMenu, session.mapServiceRef],
  );

  return (
    <ErrorBoundary>
      <AppShell>
        <MainLayout
          statusBar={statusBar}
          map={
            <MapPageContainer
              isMeasuring={session.isMeasuring}
              measurementMode={
                session.drawingMode === 'measure' || session.drawingMode === 'measure-area'
                  ? session.drawingMode
                  : null
              }
              measurePoints={session.measurePoints}
              setIsMeasuring={() => {}}
              setMeasurePoints={session.setMeasurePoints}
              focusEntityRef={session.focusEntityRef}
              mapServiceRef={session.mapServiceRef}
              onRegisterMapSiderToggle={registerMapSiderToggle}
              onAbortTarget={session.handleAbortTarget}
              handleTargetInfo={session.handleTargetInfo}
              onHamburgerClick={session.toggleSidebar}
              onTargetsClick={session.toggleTargetsPanel}
            />
          }
          settingsSidebar={
            <SidebarContainer isOpen={session.isSidebarOpen} onClose={session.closeSidebar} />
          }
          targetsPanel={
            <TargetPanel
              mapServiceRef={session.mapServiceRef}
              onAttackTarget={session.handleAttackTarget}
              onAbortTarget={session.handleAbortTarget}
              isOpen
              onToggle={session.toggleTargetsPanel}
            />
          }
        />
      </AppShell>
    </ErrorBoundary>
  );
}

export default MapPage;
