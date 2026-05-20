import type { CaliModeE } from '../enums/general.enum';
import type { Coordinates, LatLng, LatLngManual } from './coordinates';
import type { LineOfSight } from './los';

export interface MyPosition {
  coordinates: Coordinates;
  heading: number;
  gps_pos: LatLng;
  tmaps_pos: LatLng;
  manual_pos: LatLngManual;
  use_gps: boolean;
  use_manual: boolean;
  zone: number;
  fig_of_merit: number;
  pitch: number;
  roll: number;
  distance_travelled: number;
  odo_cali_finished?: CaliModeE;
  clickCord?: { lat: number; lng: number };
  gunAzimut?: number;
  los?: LineOfSight;
}

export interface MyPositionState {
  position: MyPosition | null;
  isActive: boolean;
}
