/**
 * Runtime timing tuning for the targets pipeline (WebSocket inbound,
 * reconciliation, slice trails, status polling).
 *
 * Anything counted in milliseconds that affects how frequently target
 * state mutates, ages out, or is polled lives here. Pure-data
 * helpers (`targetsRuntime.ts`, `TargetStatusService.ts`, the inbound
 * cleanup loop, the trail-trimming reducer) import from this file
 * rather than declaring their own constants.
 */

/* ------------------------------------------------------------------ */
/*  Inbound throttle / reconciliation                                   */
/* ------------------------------------------------------------------ */

/** Minimum spacing between two consecutive `updateTarget` dispatches
 *  for the SAME target id. Prevents WebSocket bursts from flooding
 *  Redux. */
export const TARGETS_UPDATE_THROTTLE_MS = 50;

/** Targets whose `lastUpdate` is older than this in the inbound
 *  cleanup loop are forcibly removed (server stopped sending them). */
export const TARGETS_CLEANUP_MS = 5000;

/** Grace window (in inbound-tick units) for the reconciliation pass —
 *  a target absent from `n` consecutive `TARGETS_DATA` messages is
 *  removed. */
export const TARGETS_RECONCILE_GRACE = 2;

/** Cadence of the inbound-handlers' background cleanup loop. */
export const TARGETS_INBOUND_CLEANUP_INTERVAL_MS = 1000;

/* ------------------------------------------------------------------ */
/*  Slice trail trimming                                                */
/* ------------------------------------------------------------------ */

/** How long (ms) a trail point stays in the slice before being
 *  pruned on the next `updateTarget` reducer call. */
export const TARGET_TRAIL_WINDOW_MS = 30000;

/* ------------------------------------------------------------------ */
/*  Background status service polling                                   */
/* ------------------------------------------------------------------ */

/** Cadence of `TargetStatusService.evaluateTargets` — checks for
 *  disconnected targets and prunes them. */
export const TARGET_STATUS_POLL_INTERVAL_MS = 1000;
