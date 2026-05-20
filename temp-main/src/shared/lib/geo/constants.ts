/** WGS84 equatorial radius in meters. */
export const EARTH_RADIUS_M = 6378137;

export const toRad = (deg: number): number => (deg * Math.PI) / 180;

export const toDeg = (rad: number): number => (rad * 180) / Math.PI;
