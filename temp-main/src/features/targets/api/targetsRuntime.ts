/**
 * Module-scoped runtime state for inbound TARGETS_DATA reconciliation.
 *
 * Timing constants are sourced from `targetRuntime.config.ts` — this
 * file only owns the mutable per-process state buckets (last-update
 * timestamps, cleanup interval handle, etc.).
 */
export {
  TARGETS_UPDATE_THROTTLE_MS,
  TARGETS_CLEANUP_MS,
  TARGETS_RECONCILE_GRACE,
} from '../config/targetRuntime.config';

export const targetsInboundRuntime = {
  lastUpdate: {} as Record<string, number>,
  seenAt: {} as Record<string, number>,
  stamp: 0,
  cleanupStarted: false,
  cleanupInterval: null as ReturnType<typeof setInterval> | null,
};
