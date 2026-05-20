import type { FilterState } from '@features/map/store/filterSlice';
import type { Target } from '@features/targets';

export function isTargetVisibleByFilter(target: Target, filters: FilterState['targets']): boolean {
  if (!filters.all) {
    return false;
  }
  const typeLower = (target.type || 'unknown').toLowerCase();
  if (target.friend) {
    return filters.friendly;
  }
  if (typeLower === 'unknown') {
    return filters.unknown;
  }
  return filters.hostile;
}
