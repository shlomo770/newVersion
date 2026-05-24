import type { Map as MaplibreMap, GeoJSONSource } from 'maplibre-gl';
import type { Target } from '@features/targets';
import { TARGET_SOURCE_IDS } from '@features/map/config';
import {
  buildAssignmentGeoJson,
  buildTargetFeatures,
  buildTrailFeatures,
  type JeepPosition,
} from './targetGeoJson';

const EMPTY_FC: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

export interface PushTargetDataInputs {
  visibleTargets: readonly Target[];
  jeep: JeepPosition | undefined;
}

/**
 * Update every targets-feature GeoJSON source with fresh data.
 *
 * The function is intentionally cheap — it only calls
 * `source.setData(...)`, never recreates anything. The expensive
 * install of sources/layers happens once in `installTargetLayers`.
 */
export function pushTargetData(map: MaplibreMap, inputs: PushTargetDataInputs): void {
  const srcTargets = map.getSource(TARGET_SOURCE_IDS.targets) as GeoJSONSource | undefined;
  const srcTrails = map.getSource(TARGET_SOURCE_IDS.trails) as GeoJSONSource | undefined;
  const srcAssign = map.getSource(TARGET_SOURCE_IDS.assignmentLines) as
    | GeoJSONSource
    | undefined;
  const srcTips = map.getSource(TARGET_SOURCE_IDS.assignmentTips) as
    | GeoJSONSource
    | undefined;

  if (!srcTargets || !srcTrails || !srcAssign || !srcTips) return;

  srcTargets.setData({
    type: 'FeatureCollection',
    features: buildTargetFeatures(inputs.visibleTargets),
  });
  srcTrails.setData({
    type: 'FeatureCollection',
    features: buildTrailFeatures(inputs.visibleTargets),
  });

  if (!inputs.jeep) {
    srcAssign.setData(EMPTY_FC);
    srcTips.setData(EMPTY_FC);
    return;
  }

  const assignment = buildAssignmentGeoJson(inputs.visibleTargets, inputs.jeep);
  srcAssign.setData({ type: 'FeatureCollection', features: assignment.lines });
  srcTips.setData({ type: 'FeatureCollection', features: assignment.tips });
}
