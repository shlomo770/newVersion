import { useEffect, type RefObject } from 'react';

export interface UseClickOutsideOptions {
  /** When false, listeners are not attached. Default true. */
  enabled?: boolean;
  /** Pointer event used for detection. Default `pointerdown` (mouse + touch). */
  eventType?: 'mousedown' | 'mouseup' | 'pointerdown' | 'touchstart';
}

/**
 * Invokes `handler` when the user clicks/taps outside all elements referenced by `refs`.
 */
export function useClickOutside(
  refs: ReadonlyArray<RefObject<HTMLElement | null>>,
  handler: () => void,
  options: UseClickOutsideOptions = {},
): void {
  const { enabled = true, eventType = 'pointerdown' } = options;

  useEffect(() => {
    if (!enabled) return;

    const onPointer = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      const inside = refs.some((ref) => {
        const el = ref.current;
        return el !== null && el.contains(target);
      });

      if (!inside) handler();
    };

    document.addEventListener(eventType, onPointer);
    return () => document.removeEventListener(eventType, onPointer);
  }, [refs, handler, enabled, eventType]);
}
