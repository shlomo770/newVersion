import type { Target } from '../store/targetsSlice';
import { ABORTABLE_TARGET_STATUSES } from '../config/targetStatus.config';

/**
 * True when an ABORT button should be shown for this target.
 *
 * A target is abortable when (a) we know where it is, and (b) either
 * an explicit `isAssigned` flag is set OR the target is in one of the
 * abortable statuses configured in `targetStatus.config.ts`.
 */
export function isAbortableTarget(target: Target): boolean {
  if (!target.coordinates) return false;
  if (target.isAssigned) return true;
  return ABORTABLE_TARGET_STATUSES.has(target.status);
}
