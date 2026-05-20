import { ModeSelector } from '@features/system-mode';
import { FullScreenLayout } from '@app/layouts';

/**
 * Splash / mode picker entry — no map or tactical overlays.
 */
export function ModeSelectionPage() {
  return (
    <FullScreenLayout variant="splash" scrollable={false}>
      <ModeSelector />
    </FullScreenLayout>
  );
}

export default ModeSelectionPage;
