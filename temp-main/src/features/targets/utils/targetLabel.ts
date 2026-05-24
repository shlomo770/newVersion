import type { Target } from '../store/targetsSlice';
import { TARGET_LABEL_NUMERIC_MAX_CHARS } from '@features/map/config';

/**
 * Format the multi-line label displayed next to a target's icon on the
 * map. First line is always the target id; the optional second line is
 * `range | altitude`, with each numeric truncated to keep the label
 * compact even when the underlying value has many digits.
 */
export function formatTargetMapLabel(target: Pick<Target, 'id' | 'range' | 'coordinates'>): string {
  const rangeStr =
    target.range != null
      ? String(target.range).slice(0, TARGET_LABEL_NUMERIC_MAX_CHARS)
      : '';
  const altStr =
    target.coordinates?.alt != null
      ? String(target.coordinates.alt).slice(0, TARGET_LABEL_NUMERIC_MAX_CHARS)
      : '';
  const secondLine = [rangeStr, altStr].filter(Boolean).join(' | ');
  return secondLine ? `${target.id}\n${secondLine}` : target.id;
}
