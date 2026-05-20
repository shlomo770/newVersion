import { useEffect, type RefObject } from 'react';

export interface UseClickOutsideOptions {
  /** When false, listeners are not attached. Default true. */
  enabled?: boolean;
  /** Mouse event used for detection. Default `mousedown`. */
  eventType?: 'mousedown' | 'mouseup' | 'pointerdown';
}

/**
 * Invokes `handler` when the user clicks outside all elements referenced by `refs`.
 */
export function useClickOutside(
  refs: ReadonlyArray<RefObject<HTMLElement | null>>,
  handler: () => void,
  options: UseClickOutsideOptions = {},
): void {
  const { enabled = true, eventType = 'mousedown' } = options;

  useEffect(() => {
    if (!enabled) return;

    const onPointer = (event: MouseEvent) => {
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
