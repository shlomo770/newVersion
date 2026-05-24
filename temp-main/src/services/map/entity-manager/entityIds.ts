/**
 * Thin re-exports of the canonical entity id builders defined in
 * `@features/map/config/mapLayers.config.ts`.
 *
 * The legacy entity-manager call sites still import from this module
 * — keeping the old names while pointing them at the central config
 * lets us avoid touching every consumer in this pass.
 */
export {
  entitySourceIdFor as entitySourceId,
  entityLayerIdFor as entityLayerId,
  entityIconLayerIdFor as entityIconLayerId,
  entityLabelSourceIdFor as entityLabelSourceId,
  entityLabelLayerIdFor as entityLabelLayerId,
} from '@features/map/config';
