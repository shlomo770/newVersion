/**
 * @deprecated Import from `@shared/lib/geo` or `@shared/lib/geo/coordinateFormat`.
 */
export {
  wgs84ToUTM,
  utmToWGS84,
  parseUTMString,
  formatWGS84,
  formatUTM,
  formatCoordinates,
  getUTMZone,
} from '@shared/lib/geo/coordinateFormat';

export type { WGS84Coordinates, UTMCoordinates } from '@shared/lib/geo/coordinateFormat';
