export {
  buildCircleCoordinatesFromPointRadius,
  buildEllipseCoordinatesFromCenterRadii,
  buildSaveEntityPayload,
  buildUpdateEntityPayload,
  normalizeCoordinates,
  toEntityCategoryEnum,
  toLocalEntityCategory,
  toLocalEntityType,
  toServerEntityCategory,
  toServerEntityType,
} from '@domain/mappers/entityWire.mapper';

export type {
  SaveEntityPayload,
  SaveEntityShapeParams,
  SaveEntityWireType,
  UpdateEntityPayload,
} from '@domain/mappers/entityWire.mapper';
