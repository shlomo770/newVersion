import { useEffect } from 'react';
import { TargetStatusService } from '../services/TargetStatusService';

/**
 * Starts target status polling while the map session is mounted; stops on unmount.
 */
export function useTargetStatusLifecycle(enabled = true): void {
  useEffect(() => {
    if (!enabled) return undefined;
    const service = TargetStatusService.getInstance();
    service.start();
    return () => {
      service.stop();
    };
  }, [enabled]);
}
