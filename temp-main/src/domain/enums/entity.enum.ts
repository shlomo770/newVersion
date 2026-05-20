/** Wire / store entity category (numeric enum used on the client). */
export enum EntityCategoryEnum {
  FREE,
  FIZ,
  WCO_FREE,
  WCO_HOLD,
}

/** Server geometry kind on SAVE_ENTITY wire payloads. */
export enum EntityTypeEnum {
  ELLIPSE,
  POLYGON,
  POLYLINE,
  CIRCLE,
}

/** UI mission sidebar tabs. */
export enum EntityMissionTab {
  FREE = 'FREE',
  FIZ = 'FIZ',
  WCO_FREE = 'WCO_FREE',
  WCO_HOLD = 'WCO_HOLD',
  MARKERS = 'MARKERS',
}

/** Human-readable labels in entity creation forms. */
export enum EntityFormCategory {
  FREE = 'FREE',
  FIZ = 'FIZ',
  WCO_FREE = 'WCO FREE',
  WCO_HOLD = 'WCO HOLD',
}

export const MISSION_DE_FILTER_ALL = 'ALL' as const;

export type MissionDeDisplayFilter = typeof MISSION_DE_FILTER_ALL | EntityMissionTab;

export enum ServerEntityCategory {
  FREE = 'FREE',
  FIZ = 'FIZ',
  WCO_FREE = 'WCO_FREE',
  WCO_HOLD = 'WCO_HOLD',
}
