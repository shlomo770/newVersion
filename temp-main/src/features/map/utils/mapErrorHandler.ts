import type { Map as MaplibreMap, StyleImageInterface } from 'maplibre-gl';

/**
 * MapLibre's `ErrorEvent` shape — declared locally because newer
 * `maplibre-gl` versions no longer export it as a named type.
 */
interface MapLibreErrorEvent {
  type: 'error';
  error: unknown;
}

const isDev = import.meta.env.DEV;

const TRANSPARENT_FALLBACK_ID = '__map-transparent-fallback__';

const NON_CRITICAL_PATTERNS: RegExp[] = [
  /could not load image/i,
  /source image could not be decoded/i,
  /could not be decoded/i,
  /failed to load tile/i,
  /failed to fetch/i,
  /network\s?error/i,
  /networkerror/i,
  /load failed/i,
  /aborted/i,
  /ajaxerror/i,
  /\b404\b/,
  /\b500\b/,
  /\b502\b/,
  /\b503\b/,
  /unsupported image/i,
  /svgs are not supported/i,
  /sprite/i,
  /glyph/i,
  /font/i,
  /tile/i,
  /raster/i,
  /vector/i,
  /pbf/i,
  /webp/i,
  /image/i,
  /decode/i,
  /fetch/i,
];

const CRITICAL_PATTERNS: RegExp[] = [
  /webgl context lost/i,
  /webgl context creation failed/i,
  /failed to initialize/i,
  /style is not done loading/i,
  /validationerror/i,
];

function getErrorMessage(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: unknown }).message ?? error);
  }
  return String(error);
}

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = Number((error as { status?: unknown }).status);
    return Number.isFinite(status) ? status : undefined;
  }
  return undefined;
}

export function isNonCriticalMapError(error: unknown): boolean {
  const message = getErrorMessage(error);
  const status = getErrorStatus(error);

  if (status === 404 || status === 0) return true;
  if (status !== undefined && status >= 400 && status < 600) return true;

  if (CRITICAL_PATTERNS.some((pattern) => pattern.test(message))) {
    return false;
  }

  if (NON_CRITICAL_PATTERNS.some((pattern) => pattern.test(message))) {
    return true;
  }

  // Unknown map resource failures should not surface to users in production.
  return !isDev;
}

export function isMapLibreConsoleNoise(message: string): boolean {
  if (!message) return false;
  if (message.includes('WebSocket') || message.includes('ws://') || message.includes('wss://')) {
    return false;
  }
  return isNonCriticalMapError(message);
}

class ThrottledMapLogger {
  private readonly counts = new Map<string, { count: number; windowStart: number }>();
  private readonly windowMs = 10_000;
  private readonly maxPerWindow = 2;

  debug(key: string, message: string): void {
    if (!isDev) return;

    const now = Date.now();
    const entry = this.counts.get(key);
    if (!entry || now - entry.windowStart > this.windowMs) {
      this.counts.set(key, { count: 1, windowStart: now });
      console.debug(`[map] ${message}`);
      return;
    }

    if (entry.count >= this.maxPerWindow) return;
    entry.count += 1;
    console.debug(`[map] ${message}`);
  }
}

const throttledLogger = new ThrottledMapLogger();

function createTransparentImageSpec(): StyleImageInterface {
  return {
    width: 1,
    height: 1,
    data: new Uint8Array([0, 0, 0, 0]),
  };
}

function ensureTransparentFallbackImage(map: MaplibreMap): void {
  if (map.hasImage(TRANSPARENT_FALLBACK_ID)) return;
  try {
    map.addImage(TRANSPARENT_FALLBACK_ID, createTransparentImageSpec(), { pixelRatio: 1 });
  } catch {
    /* duplicate race */
  }
}

/**
 * Image ids that other layers (e.g. TargetsLayer) load on demand.
 * For these ids we MUST NOT register a 1×1 transparent placeholder, because
 * MapLibre would cache it and the real icon would never appear afterwards.
 * Owners register themselves via `registerOwnedMapImageIds()`.
 */
const ownedMissingImageIds = new Set<string>();
const ownedMissingImageMatchers: Array<(id: string) => boolean> = [];

export function registerOwnedMapImageIds(
  ids: readonly string[],
  matcher?: (id: string) => boolean,
): () => void {
  for (const id of ids) ownedMissingImageIds.add(id);
  if (matcher) ownedMissingImageMatchers.push(matcher);
  return () => {
    for (const id of ids) ownedMissingImageIds.delete(id);
    if (matcher) {
      const idx = ownedMissingImageMatchers.indexOf(matcher);
      if (idx >= 0) ownedMissingImageMatchers.splice(idx, 1);
    }
  };
}

function isOwnedMissingImageId(id: string): boolean {
  if (ownedMissingImageIds.has(id)) return true;
  return ownedMissingImageMatchers.some((match) => {
    try {
      return match(id);
    } catch {
      return false;
    }
  });
}

function handleStyleImageMissing(map: MaplibreMap, event: { id: string }): void {
  if (!event.id || map.hasImage(event.id)) return;
  if (isOwnedMissingImageId(event.id)) {
    // Another feature owns this image and will load it on demand —
    // never replace it with a transparent placeholder.
    return;
  }
  ensureTransparentFallbackImage(map);
  try {
    map.addImage(event.id, createTransparentImageSpec(), { pixelRatio: 1 });
  } catch {
    /* duplicate race */
  }
}

function handleMapError(event: MapLibreErrorEvent): void {
  const message = getErrorMessage(event.error);
  const dedupeKey = message.slice(0, 120) || 'unknown-map-error';

  if (isNonCriticalMapError(event.error)) {
    throttledLogger.debug(dedupeKey, message);
    return;
  }

  if (isDev) {
    throttledLogger.debug(`critical:${dedupeKey}`, message);
    console.error('[map] critical error:', event.error);
  }
}

/**
 * Attach MapLibre error handlers so missing/invalid tiles and images fail silently.
 * MapLibre only auto-logs to console when no `error` listener is registered.
 */
export function attachMapErrorHandlers(map: MaplibreMap): () => void {
  const onError = (event: MapLibreErrorEvent) => handleMapError(event);
  const onStyleImageMissing = (event: { id: string }) => handleStyleImageMissing(map, event);
  const onAbort = () => {
    /* expected during pan/zoom/style changes */
  };

  map.on('error', onError);
  map.on('styleimagemissing', onStyleImageMissing);
  map.on('dataabort', onAbort);
  map.on('sourcedataabort', onAbort);

  return () => {
    map.off('error', onError);
    map.off('styleimagemissing', onStyleImageMissing);
    map.off('dataabort', onAbort);
    map.off('sourcedataabort', onAbort);
  };
}

/**
 * Safety net for MapLibre messages that still reach console.error outside map events.
 */
export function setupMapConsoleErrorFilter(): void {
  if ((globalThis as { __mapErrorFilterInstalled?: boolean }).__mapErrorFilterInstalled) {
    return;
  }

  const originalError = console.error.bind(console);

  console.error = (...args: unknown[]) => {
    try {
      const combined = args
        .map((arg) => (typeof arg === 'string' ? arg : getErrorMessage(arg)))
        .join(' ');

      if (isMapLibreConsoleNoise(combined)) {
        throttledLogger.debug(combined.slice(0, 120), combined);
        return;
      }

      originalError(...args);
    } catch {
      originalError(...args);
    }
  };

  (globalThis as { __mapErrorFilterInstalled?: boolean }).__mapErrorFilterInstalled = true;
}

/**
 * Safe wrapper for map.loadImage — resolves even when the image is missing or corrupt.
 */
export function safeLoadMapImage(
  map: MaplibreMap,
  url: string,
  imageId: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    if (map.hasImage(imageId)) {
      resolve(true);
      return;
    }

    map.loadImage(url, (error, image) => {
      if (error || !image) {
        throttledLogger.debug(`image:${url}`, getErrorMessage(error) || `Failed to load ${url}`);
        resolve(false);
        return;
      }

      if (!map.hasImage(imageId)) {
        try {
          map.addImage(imageId, image);
          resolve(true);
          return;
        } catch {
          resolve(map.hasImage(imageId));
          return;
        }
      }

      resolve(true);
    });
  });
}
