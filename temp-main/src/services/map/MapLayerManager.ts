import { store } from '@app/store';
import { ENTITY_PAINT_DEFAULTS, entityLayerIdFor } from '@features/map/config';

/**
 * Thin wrapper around MapLibre layer/source mutation calls used by the
 * MapService stack. Only methods with active callers live here — older
 * generic toggle helpers were removed because feature code now uses
 * `map.setLayoutProperty` / `setPaintProperty` directly via
 * `TargetsLayer` and the entity manager.
 */
export class MapLayerManager {
  private map: maplibregl.Map;

  constructor(map: maplibregl.Map) {
    this.map = map;
  }

  /** Used by MapMeasurementService to tear down ephemeral overlay layers. */
  public removeLayerAndSource(layerId: string, sourceId?: string): void {
    if (!this.map) return;
    const resolvedSourceId = sourceId || layerId;
    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
    }
    if (this.map.getSource(resolvedSourceId)) {
      this.map.removeSource(resolvedSourceId);
    }
  }

  /** Recomputes color/opacity for every entity layer from the current
   *  Redux entity state. Called by MapService after entity styling
   *  changes (color picker, transparency slider). */
  public updateEntityColors(): void {
    if (!this.map || !this.map.isStyleLoaded()) return;

    try {
      const state = store.getState();
      const entities = state.entities.byId;

      Object.entries(entities).forEach(([entityId, entity]) => {
        const layerId = entityLayerIdFor(entityId);
        const layer = this.map.getLayer(layerId);

        if (!layer) return;

        const color = entity.color || ENTITY_PAINT_DEFAULTS.color;
        const transparency =
          'transparency' in entity && typeof entity.transparency === 'number'
            ? entity.transparency > 1
              ? entity.transparency / 100
              : entity.transparency
            : ENTITY_PAINT_DEFAULTS.opacity;

        if (entity.type === 'line') {
          this.map.setPaintProperty(layerId, 'line-color', color);
          this.map.setPaintProperty(layerId, 'line-opacity', 1 - transparency);
        } else if (
          entity.type === 'polygon' ||
          entity.type === 'circle' ||
          entity.type === 'rectangle'
        ) {
          this.map.setPaintProperty(layerId, 'fill-color', color);
          this.map.setPaintProperty(layerId, 'fill-opacity', transparency);
        } else if (entity.type === 'marker') {
          this.map.setPaintProperty(layerId, 'circle-color', color);
          this.map.setPaintProperty(layerId, 'circle-opacity', 1 - transparency);
        }
      });
    } catch (error) {
      console.error('Error updating entity colors:', error);
    }
  }
}
