import type { CaliModeE } from '@domain/enums/general.enum';
import type { TacticalEntity } from '@domain/models';

export type {
  Coordinates,
  LatLng,
  LatLngManual,
  WGS84Coordinates,
  UTMCoordinates,
} from '@domain/models/coordinates';

export type {
  EntityType,
  EntityStyle,
  GeoJsonGeometry,
  TacticalEntity,
  DrawingMode,
} from '@domain/models/entity';

/** @deprecated Prefer `TacticalEntity` — kept for incremental migration. */
export type Entity = TacticalEntity;

export type { Mission, MissionEntityRef, SaveMissionEntityWire } from '@domain/models/mission';

export type {
  MapTypeId,
  MapLayerKind,
  MapTypesSelector,
  MapState,
} from '@domain/models/map';
export { MAP_TYPES, mapTypes, mapTypesSelected } from '@domain/models/map';

export type { MyPosition, MyPositionState } from '@domain/models/position';
export type {
  LineOfSight,
  LosVisibilityStatus,
  LosPoint,
  LosRay,
  LosResult,
} from '@domain/models/los';

export type { PanelType } from '@domain/models/panel';

export type { CaliModeE };
