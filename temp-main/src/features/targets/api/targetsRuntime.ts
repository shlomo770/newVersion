/** Module-scoped runtime state for inbound TARGETS_DATA reconciliation. */
export const targetsInboundRuntime = {
  lastUpdate: {} as Record<string, number>,
  seenAt: {} as Record<string, number>,
  stamp: 0,
  cleanupStarted: false,
  cleanupInterval: null as ReturnType<typeof setInterval> | null,
};

export const TARGETS_UPDATE_THROTTLE_MS = 50;
export const TARGETS_CLEANUP_MS = 5000;
export const TARGETS_RECONCILE_GRACE = 2;
