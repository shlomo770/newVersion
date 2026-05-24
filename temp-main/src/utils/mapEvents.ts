type MapPointerEvent = maplibregl.MapMouseEvent | maplibregl.MapTouchEvent;

type MapClickHandler = (e: maplibregl.MapMouseEvent) => void;
type MapMoveHandler = (e: MapPointerEvent) => void;

/**
 * Attach a map tap/click handler for mouse and touch.
 *
 * MapLibre emits `click` for genuine taps (not map pans). Using `touchend`
 * directly would also fire after pan gestures and add stray measurement points.
 */
export function attachUnifiedMapClick(
  map: maplibregl.Map,
  handler: (e: MapPointerEvent) => void,
): MapClickHandler {
  const clickHandler = handler as MapClickHandler;
  map.on('click', clickHandler);
  return clickHandler;
}

export function detachUnifiedMapClick(
  map: maplibregl.Map,
  handler: MapClickHandler,
): void {
  map.off('click', handler);
}

/** Live pointer move — mouse drag and single-finger touch drag. */
export function attachUnifiedMapMove(
  map: maplibregl.Map,
  handler: MapMoveHandler,
): MapMoveHandler {
  map.on('mousemove', handler);
  map.on('touchmove', handler);
  return handler;
}

export function detachUnifiedMapMove(
  map: maplibregl.Map,
  handler: MapMoveHandler,
): void {
  map.off('mousemove', handler);
  map.off('touchmove', handler);
}

export function createThrottledCallback<T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number = 16,
): (...args: T) => void {
  let timeoutId: number | null = null;

  return (...args: T) => {
    if (timeoutId) return;

    timeoutId = window.setTimeout(() => {
      callback(...args);
      timeoutId = null;
    }, delay);
  };
}
