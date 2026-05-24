import { useCallback, useMemo, useState } from 'react';
import type { PanelType } from '@/types';
import MapPageContainer from './MapPageContainer';
import { ErrorBoundary } from '@shared/components';
import { SidebarContainer } from '@features/sidebar';
import { TargetPanel } from '@features/targets';
import { StatusBar } from '@features/status-bar';
import { AppShell, MainLayout } from '@app/layouts';
import { MapCommandsProvider } from '@features/map';
import { useMapPageSession } from './hooks/useMapPageSession';

/**
 * Mission / training map view: composes layout shells with existing feature UI.
 * StatusBar is mounted at the layout root — outside the map canvas subtree.
 */
export function MapPage() {
  const session = useMapPageSession();
  const [activeSidebarPanel, setActiveSidebarPanel] = useState<PanelType>(null);

  const handleStatusBarMenu = useCallback(() => {
    session.toggleSidebar();
  }, [session.toggleSidebar]);

  const handleCloseSidebar = useCallback(() => {
    session.closeSidebar();
    setActiveSidebarPanel(null);
  }, [session.closeSidebar]);

  const statusBar = useMemo(
    () => <StatusBar onMenuClick={handleStatusBarMenu} mapServiceRef={session.mapServiceRef} />,
    [handleStatusBarMenu, session.mapServiceRef],
  );

  return (
    <ErrorBoundary>
      <MapCommandsProvider mapServiceRef={session.mapServiceRef}>
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
                onAbortTarget={session.handleAbortTarget}
                handleTargetInfo={session.handleTargetInfo}
                onHamburgerClick={session.toggleSidebar}
                isSidebarOpen={session.isSidebarOpen}
                activeSidebarPanel={activeSidebarPanel}
                onCloseSidebar={handleCloseSidebar}
              />
            }
            settingsSidebar={
              <SidebarContainer
                isOpen={session.isSidebarOpen}
                activePanel={activeSidebarPanel}
                onActivePanelChange={setActiveSidebarPanel}
              />
            }
            targetsPanel={
              <TargetPanel
                mapServiceRef={session.mapServiceRef}
                onAttackTarget={session.handleAttackTarget}
                onAbortTarget={session.handleAbortTarget}
              />
            }
          />
        </AppShell>
      </MapCommandsProvider>
    </ErrorBoundary>
  );
}

export default MapPage;
