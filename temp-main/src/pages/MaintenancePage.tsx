import { MaintenanceDashboard } from '@features/maintenance';
import { FullScreenLayout } from '@app/layouts';

/**
 * Maintenance mode diagnostics view.
 */
export function MaintenancePage() {
  return (
    <FullScreenLayout variant="maintenance" scrollable>
      <MaintenanceDashboard />
    </FullScreenLayout>
  );
}

export default MaintenancePage;
