/** Unified platform status enums (replaces legacy `statusBar.enum` / `ststusBar.enum`). */

export enum GeneralStatusWireE {
  OK = 'OK',
  WARNING = 'WARNING',
  FAIL = 'FAIL',
  NO_COME = 'NO_COME',
  STBY = 'STBY',
}

export enum RadarStatusE {
  NO_COMM,
  FAIL,
  WARNING,
  ACTIVE,
  OK,
}

export enum RadarStateE {
  OFF,
  INIT,
  STANDBY,
  MAINTENANCE,
  OPERATE,
}

export enum GunStatusE {
  NO_COMM,
  FAIL,
  UNAVAILABLE,
  WARNING,
  READY,
  DESIGNATED,
  TRACK,
  ARM,
}

export enum RecordingStatusE {
  RECORDING,
}

export enum FaultNormalE {
  FAULT = 'FAULT',
  NORMAL = 'NORMAL',
}

export enum InsStatusE {
  NO_COMM,
  STARTUP,
  ALIGN,
  SURVEY,
  ZUPT,
  FAIL,
}

export enum SystemModeE {
  AUTO,
  SEMI_AUTO,
  MANUAL,
}
