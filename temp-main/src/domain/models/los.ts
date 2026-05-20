import type { Coordinates } from './coordinates';

export interface LineOfSight {
  rangeKM: number;
  angleDEG: number;
}

export type LosVisibilityStatus = 'visible' | 'partially_blocked' | 'blocked';

export interface LosPoint {
  lat: number;
  lng: number;
  distance: number;
  blockElevation: number;
  status: LosVisibilityStatus;
}

export interface LosRay {
  angle: number;
  points: LosPoint[];
  from?: Coordinates;
  to?: Coordinates;
  severity?: string;
  elevation?: number;
}

export interface LosResult {
  origin: Coordinates;
  heading: number;
  rangeKM: number;
  angleDEG: number;
  rays: LosRay[];
  sector?: Record<string, unknown>;
}
