/**
 * Coordinates map listener ownership between tactical click-draw and MapLibre Draw.
 * Only one path may handle map pointer events at a time.
 */
export interface DrawLibrarySessionHooks {
  /** Called when @hyvilo/maplibre-gl-draw takes over pointer handling. */
  onLibraryTakeover?: () => void;
  /** Called when the draw library releases pointer handling. */
  onLibraryRelease?: () => void;
}

export class DrawLibrarySessionGate {
  private depth = 0;

  constructor(private readonly hooks: DrawLibrarySessionHooks = {}) {}

  isActive(): boolean {
    return this.depth > 0;
  }

  /** Invoke before attaching draw control or entering a draw_* mode. */
  enter(): void {
    if (this.depth === 0) {
      this.hooks.onLibraryTakeover?.();
    }
    this.depth += 1;
  }

  /** Invoke after draw finishes, clears, or detaches. */
  leave(): void {
    if (this.depth <= 0) return;
    this.depth -= 1;
    if (this.depth === 0) {
      this.hooks.onLibraryRelease?.();
    }
  }

  /** Force release (e.g. destroy / style swap). */
  reset(): void {
    if (this.depth > 0) {
      this.depth = 0;
      this.hooks.onLibraryRelease?.();
    }
  }
}
