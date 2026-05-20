type MapPointerEvent = maplibregl.MapMouseEvent | maplibregl.MapTouchEvent;

export function attachUnifiedMapClick(
  map: maplibregl.Map,
  handler: (e: MapPointerEvent) => void
) {
  const wrapped = (e: MapPointerEvent) => {
    handler(e);
  };

  map.on('click', wrapped);
  map.on('touchend', wrapped);
  return wrapped;
}

export function attachUnifiedMapMove(
  map: maplibregl.Map,
  handler: (e: MapPointerEvent) => void
) {
  map.on('mousemove', handler);
  map.on('touchmove', handler);
  return handler;
}

export function detachUnifiedMapClick(
  map: maplibregl.Map,
  wrappedHandler: (e: MapPointerEvent) => void
) {
  map.off('click', wrappedHandler);
  map.off('touchend', wrappedHandler);
}

export function detachUnifiedMapMove(
  map: maplibregl.Map,
  handler: any
) {
  map.off('mousemove', handler);
  map.off('touchmove', handler);
}

export function createThrottledCallback<T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number = 16
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