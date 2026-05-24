import { parseUTMString, utmToWGS84 } from '@/utils/coordinates';
import { isValidMapCoordinate } from '../selectors/statusBarSelectors';

export function parseStatusBarCoordInput(
  value: string,
  isUTM: boolean,
): { lat: number; lng: number } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (isUTM) {
    try {
      return utmToWGS84(parseUTMString(trimmed));
    } catch {
      return null;
    }
  }

  const parts = trimmed.split(/[\s,;]+/).filter(Boolean);
  if (parts.length >= 2) {
    const lat = Number.parseFloat(parts[0].replace(/,/g, '.'));
    const lng = Number.parseFloat(parts[1].replace(/,/g, '.'));
    if (isValidMapCoordinate(lat, lng)) return { lat, lng };
  }

  return null;
}
