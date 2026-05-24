import { markerIconImageId } from '@features/map/config';

const MDL2_FONT = 'Segoe MDL2 Assets';
const FLUENT_FONT = 'Segoe Fluent Icons';

export const MARKER_ICONS = [
  { code: 'E7BA', label: 'Warning', font: MDL2_FONT },
  { code: 'E80F', label: 'Building', font: MDL2_FONT },
  { code: 'E7E3', label: 'Ship', font: MDL2_FONT },
  { code: 'E7C1', label: 'Flag', font: MDL2_FONT },
  { code: 'E7C3', label: 'Target', font: MDL2_FONT },
  { code: 'EC3E', label: 'Antenna', font: FLUENT_FONT },
  { code: 'E709', label: 'Plane', font: MDL2_FONT },
  { code: 'EC4A', label: 'Fuel', font: FLUENT_FONT },
  { code: 'E72E', label: 'Shield', font: MDL2_FONT },
  { code: 'E734', label: 'Diamond', font: MDL2_FONT },
] as const;

export type MarkerIconCode = typeof MARKER_ICONS[number]['code'];

/** Marker icons that ship from the Fluent font rather than MDL2. */
const FLUENT_FONT_CODES = new Set<string>(
  MARKER_ICONS.filter((icon) => icon.font === FLUENT_FONT).map((icon) => icon.code),
);

/** Canvas configuration for rendering a marker icon to MapLibre. */
const MARKER_ICON_CANVAS = {
  sizePx: 40,
  fontSizePx: 28,
  fillColor: '#1a1a1a',
} as const;

export function getMarkerIconChar(code: string): string {
  return String.fromCharCode(parseInt(code, 16));
}

const iconFont = (code: string): string => (FLUENT_FONT_CODES.has(code) ? FLUENT_FONT : MDL2_FONT);

export function createMarkerIconImageData(code: string): {
  width: number;
  height: number;
  data: Uint8ClampedArray;
} {
  const size = MARKER_ICON_CANVAS.sizePx;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { width: size, height: size, data: new Uint8ClampedArray(size * size * 4) };
  ctx.clearRect(0, 0, size, size);
  ctx.font = `${MARKER_ICON_CANVAS.fontSizePx}px "${iconFont(code)}", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = MARKER_ICON_CANVAS.fillColor;
  ctx.fillText(getMarkerIconChar(code), size / 2, size / 2);
  const imageData = ctx.getImageData(0, 0, size, size);
  return { width: imageData.width, height: imageData.height, data: imageData.data };
}

export function getMarkerIconImageId(code: string): string {
  return markerIconImageId(code);
}
