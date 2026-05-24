import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@app/store';
import { formatCoordinates } from '@shared/lib/geo/coordinateFormat';
import type { InsStatusE, RadarStatusE, GunStatusE, SystemModeE } from '@domain/enums/status.enum';
import type { SelectedModeE } from '@domain/enums/general.enum';

export const selectElevationValue = (state: RootState): number | null =>
  state.elevation.elevation;

export const selectIsUtm = (state: RootState): boolean => state.coordinates.isUTM;

export const selectUtmZone = (state: RootState): number => state.coordinates.utmZone;

export const selectRadarStatus = (state: RootState): RadarStatusE =>
  state.radar.status as RadarStatusE;

export const selectGunStatus = (state: RootState): GunStatusE =>
  state.gun.status as GunStatusE;

export const selectInsStatus = (state: RootState): InsStatusE =>
  state.ins?.status as InsStatusE;

export const selectSystemMode = (state: RootState): SystemModeE =>
  state.systemState.systemMode as SystemModeE;

export const selectSelectedMode = (state: RootState): SelectedModeE | null =>
  state.systemState.selectedMode;

export const selectActiveMissionId = (state: RootState): string | null =>
  state.entities.activeMissionId;

export const selectClickCoordLat = (state: RootState): number =>
  state.myPosition.clickCord?.lat ?? 0;

export const selectClickCoordLng = (state: RootState): number =>
  state.myPosition.clickCord?.lng ?? 0;

export const selectMyPositionLat = (state: RootState): number =>
  state.myPosition.coordinates?.lat ?? 0;

export const selectMyPositionLng = (state: RootState): number =>
  state.myPosition.coordinates?.lng ?? 0;

export const selectGpsPositionLat = (state: RootState): number =>
  state.myPosition.gps_pos?.lat ?? 0;

export const selectGpsPositionLng = (state: RootState): number =>
  state.myPosition.gps_pos?.lng ?? 0;

export function isValidMapCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export const selectHasValidGpsPosition = createSelector(
  [selectGpsPositionLat, selectGpsPositionLng],
  (lat, lng) => isValidMapCoordinate(lat, lng),
);

export const selectHasValidClickCoords = createSelector(
  [selectClickCoordLat, selectClickCoordLng],
  (lat, lng) => isValidMapCoordinate(lat, lng),
);

/** Target for the GPS center action — prefers live GPS, then TMAPS/vehicle position. */
export const selectGpsCenterCoords = createSelector(
  [
    selectGpsPositionLat,
    selectGpsPositionLng,
    (state: RootState) => state.myPosition.tmaps_pos?.lat ?? 0,
    (state: RootState) => state.myPosition.tmaps_pos?.lng ?? 0,
    selectMyPositionLat,
    selectMyPositionLng,
    (state: RootState) => state.myPosition.use_gps,
  ],
  (gpsLat, gpsLng, tmapsLat, tmapsLng, posLat, posLng, useGps) => {
    if (isValidMapCoordinate(gpsLat, gpsLng)) {
      return { lat: gpsLat, lng: gpsLng };
    }
    if (useGps && isValidMapCoordinate(posLat, posLng)) {
      return { lat: posLat, lng: posLng };
    }
    if (isValidMapCoordinate(tmapsLat, tmapsLng)) {
      return { lat: tmapsLat, lng: tmapsLng };
    }
    if (isValidMapCoordinate(posLat, posLng)) {
      return { lat: posLat, lng: posLng };
    }
    return null;
  },
);

export const selectHasValidGpsCenter = createSelector(
  [selectGpsCenterCoords],
  (coords) => coords !== null,
);

export const selectStatusBarCoordsLabel = createSelector(
  [
    selectClickCoordLat,
    selectClickCoordLng,
    selectMyPositionLat,
    selectMyPositionLng,
    selectIsUtm,
    selectUtmZone,
  ],
  (clickLat, clickLng, posLat, posLng, isUTM, utmZone) => {
    const hasClick = Number.isFinite(clickLat) && Number.isFinite(clickLng) && (clickLat !== 0 || clickLng !== 0);
    const display = hasClick
      ? { lat: clickLat, lng: clickLng }
      : Number.isFinite(posLat) && Number.isFinite(posLng) && (posLat !== 0 || posLng !== 0)
        ? { lat: posLat, lng: posLng }
        : null;
    return display ? formatCoordinates(display, isUTM, utmZone) : '31N 45827 E 454587';
  },
);

export const selectStatusBarElevationLabel = createSelector(
  [selectElevationValue],
  (elevation) =>
    elevation !== null && elevation !== undefined
      ? `${Number(elevation).toFixed(0)} m`
      : '1085 m',
);

export const selectStatusBarClickCoords = createSelector(
  [selectClickCoordLat, selectClickCoordLng],
  (lat, lng) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat === 0 && lng === 0) return null;
    return { lat, lng };
  },
);

/** Lat/lng pair currently rendered in the status-bar coordinate readout. */
export const selectStatusBarDisplayCoords = createSelector(
  [
    selectClickCoordLat,
    selectClickCoordLng,
    selectMyPositionLat,
    selectMyPositionLng,
  ],
  (clickLat, clickLng, posLat, posLng) => {
    if (isValidMapCoordinate(clickLat, clickLng)) {
      return { lat: clickLat, lng: clickLng };
    }
    if (isValidMapCoordinate(posLat, posLng)) {
      return { lat: posLat, lng: posLng };
    }
    return null;
  },
);
