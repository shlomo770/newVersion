import type { Map as MaplibreMap } from 'maplibre-gl';
import {
  TARGET_OVERLAY_LAYOUT,
  targetIconScaleForZoom,
} from '@features/targets/config';

/**
 * Pure on-screen layout math for the ABORT-button overlay attached to
 * each abortable target. Every tunable constant (button width/height,
 * gap, label assumptions, icon-scale ramp) lives in
 * `@features/targets/config/targetVisuals.config.ts`. This file only
 * does geometry.
 */

/** Re-export so existing callers (`TargetsLayer.tsx`) don't need to
 *  reach into the targets-config barrel themselves. */
export const ABORT_BUTTON_WIDTH_PX = TARGET_OVERLAY_LAYOUT.abortButtonWidthPx;
export const ABORT_BUTTON_HEIGHT_PX = TARGET_OVERLAY_LAYOUT.abortButtonHeightPx;

/**
 * Estimate on-screen footprint from target anchor to bottom of label.
 * Icon stays at anchor; button is placed below icon + label + gap.
 */
function estimateTargetUiBottomPx(map: MaplibreMap): number {
  const zoom = map.getZoom();
  const iconScale = targetIconScaleForZoom(zoom);
  const iconDiameter = TARGET_OVERLAY_LAYOUT.iconBaseDiameterPx * iconScale;
  const iconBottom = iconDiameter * 0.5 + TARGET_OVERLAY_LAYOUT.statusRingRadiusPx;

  const { textSizePx, offsetEm, maxLines, lineHeightRatio } = TARGET_OVERLAY_LAYOUT.label;
  const lineHeight = textSizePx * lineHeightRatio;
  const labelTop = iconBottom + offsetEm * textSizePx;
  const labelBottom = labelTop + lineHeight * maxLines;

  return labelBottom;
}

/**
 * Screen position for abort button: horizontally centered on target,
 * vertically below icon + label with a clean gap.
 */
export function getAbortButtonScreenPosition(
  map: MaplibreMap,
  lng: number,
  lat: number,
): { x: number; y: number } {
  const anchor = map.project([lng, lat]);
  const uiBottom = estimateTargetUiBottomPx(map);

  return {
    x: anchor.x,
    y: anchor.y + uiBottom + TARGET_OVERLAY_LAYOUT.buttonGapBelowLabelPx,
  };
}
