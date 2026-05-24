import type { Target } from '@features/targets';
import { getTargetIconIdFromTarget } from '@features/targets/utils/targetIconResolver';
import { formatTargetMapLabel } from '@features/targets/utils/targetLabel';
import { TARGET_ASSIGNMENT_TIP_GEOMETRY } from '@features/map/config';
import { isAbortableTarget } from '@features/targets/utils/targetAbortRule';
import { TargetStateString } from '@/enums/target.enum';

/**
 * Pure GeoJSON builders for the targets layer pipeline.
 *
 * Every function in this module is a deterministic transform from
 * Redux/state inputs to a `FeatureCollection`-ready array. No MapLibre
 * imports, no React, no side effects — so it can be reasoned about and
 * tested in isolation.
 */

export interface JeepPosition {
  lng: number;
  lat: number;
}

/** Per-feature properties stamped onto every target point. The layer
 *  filters / data expressions reference these property names. */
interface TargetFeatureProps {
  id: string;
  heading: number;
  iconId: string;
  label: string;
  isRecommended: boolean;
  isAssigned: boolean;
  isLocked: boolean;
  isAllocated: boolean;
  isDestroyed: boolean;
}

/** Build the FeatureCollection for the target icon + label + ring layers. */
export function buildTargetFeatures(
  visibleTargets: readonly Target[],
): GeoJSON.Feature<GeoJSON.Point, TargetFeatureProps>[] {
  const features: GeoJSON.Feature<GeoJSON.Point, TargetFeatureProps>[] = [];
  for (const t of visibleTargets) {
    if (!t.coordinates) continue;
    const lng = Number(t.coordinates.lng);
    const lat = Number(t.coordinates.lat);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;

    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: {
        id: t.id,
        heading: t.heading ?? 0,
        iconId: getTargetIconIdFromTarget(t),
        label: formatTargetMapLabel(t),
        isRecommended: Boolean(t.isRecommended),
        isAssigned: Boolean(t.isAssigned),
        isLocked: Boolean(t.isLocked),
        isAllocated: t.status === TargetStateString.allocated,
        isDestroyed: t.status === TargetStateString.destroyed,
      },
    });
  }
  return features;
}

/** Build the FeatureCollection for trail line strings. Targets with
 *  fewer than 2 trail points are skipped (LineStrings need ≥2 coords). */
export function buildTrailFeatures(
  visibleTargets: readonly Target[],
): GeoJSON.Feature<GeoJSON.LineString>[] {
  const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];
  for (const t of visibleTargets) {
    if (!t.trail || t.trail.length < 2) continue;
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: t.trail.map((p) => [p.lng, p.lat] as [number, number]),
      },
      properties: { id: t.id },
    });
  }
  return features;
}

/** Lines + tips together — both are derived from the same iteration
 *  over `visibleTargets`, so they're produced as one structure to
 *  avoid duplicating the abortable-check loop. */
export interface AssignmentLineGeoJson {
  lines: GeoJSON.Feature<GeoJSON.LineString>[];
  tips: GeoJSON.Feature<GeoJSON.LineString>[];
}

/** Build the assignment lines (jeep → target) and the V-shaped arrow
 *  tips at each target end. Returns empty arrays when no jeep position
 *  is known. */
export function buildAssignmentGeoJson(
  visibleTargets: readonly Target[],
  jeep: JeepPosition | undefined,
): AssignmentLineGeoJson {
  const result: AssignmentLineGeoJson = { lines: [], tips: [] };
  if (!jeep) return result;

  const { lengthDeg, angleRad } = TARGET_ASSIGNMENT_TIP_GEOMETRY;

  for (const t of visibleTargets) {
    if (!t.coordinates) continue;
    if (!isAssignmentLineTarget(t)) continue;

    const target = t.coordinates;

    result.lines.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [jeep.lng, jeep.lat],
          [target.lng, target.lat],
        ],
      },
      properties: {
        id: t.id,
        isAssigned: Boolean(t.isAssigned),
        isLocked: Boolean(t.isLocked),
        isAllocated: t.status === TargetStateString.allocated,
        isDestroyed: t.status === TargetStateString.destroyed,
      },
    });

    const dir = Math.atan2(jeep.lat - target.lat, jeep.lng - target.lng);
    const left = {
      lng: target.lng + lengthDeg * Math.cos(dir + angleRad),
      lat: target.lat + lengthDeg * Math.sin(dir + angleRad),
    };
    const right = {
      lng: target.lng + lengthDeg * Math.cos(dir - angleRad),
      lat: target.lat + lengthDeg * Math.sin(dir - angleRad),
    };

    result.tips.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [target.lng, target.lat],
          [left.lng, left.lat],
        ],
      },
      properties: { id: `${t.id}_left` },
    });
    result.tips.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [target.lng, target.lat],
          [right.lng, right.lat],
        ],
      },
      properties: { id: `${t.id}_right` },
    });
  }

  return result;
}

/** Filter applied to assignment-line generation. */
function isAssignmentLineTarget(t: Target): boolean {
  return (
    Boolean(t.isAssigned) ||
    Boolean(t.isLocked) ||
    t.status === TargetStateString.allocated ||
    t.status === TargetStateString.destroyed
  );
}

/** Re-export here so callers that want a single import for "everything
 *  layer-data-related" don't have to reach into multiple feature folders. */
export { isAbortableTarget };
