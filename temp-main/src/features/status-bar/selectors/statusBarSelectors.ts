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
