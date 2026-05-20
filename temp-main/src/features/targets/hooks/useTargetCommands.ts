import { useCallback } from 'react';
import {
  sendAllocateTarget,
  sendCancelEngagement,
  sendSetTargetInfo,
} from '../api/outboundBuilders';

/**
 * Typed outbound target lifecycle commands for panels, map menus, and session hooks.
 */
export function useTargetCommands() {
  const allocateTarget = useCallback((targetId: string) => {
    sendAllocateTarget(targetId);
  }, []);

  const abortTarget = useCallback((targetId: string) => {
    sendCancelEngagement(targetId);
  }, []);

  const setTargetInfo = useCallback((targetId: string, identityFriend: boolean) => {
    sendSetTargetInfo(targetId, identityFriend);
  }, []);

  return {
    allocateTarget,
    abortTarget,
    setTargetInfo,
  };
}
