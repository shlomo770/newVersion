/** Mapbox GL Draw custom modes (legacy `any` surface required by draw plugin API). */

export function createRectangleMode(): Record<string, unknown> {
  return {
    onSetup: function (this: Record<string, unknown>): unknown {
      const polygon = (this as { newFeature: (f: unknown) => unknown }).newFeature({
        type: 'Feature',
        properties: { shape: 'rectangle' },
        geometry: {
          type: 'Polygon',
          coordinates: [[]],
        },
      });
      (this as { addFeature: (f: unknown) => void }).addFeature(polygon);
      (this as { clearSelectedFeatures: () => void }).clearSelectedFeatures();
      (this as { updateUIClasses: (c: Record<string, string>) => void }).updateUIClasses({
        mouse: 'add',
      });
      (this as { activateUIButton: (n: string) => void }).activateUIButton('Polygon');
      (this as { setActionableState: (s: Record<string, boolean>) => void }).setActionableState({
        trash: true,
      });
      return polygon;
    },
    onClick: function (this: Record<string, unknown>): void {
      (this as { updateUIClasses: (c: Record<string, string>) => void }).updateUIClasses({
        mouse: 'add',
      });
      const currentVertex = (this as { getCurrent: () => { properties: { active: string } } }).getCurrent();
      if (currentVertex && currentVertex.properties.active !== 'true') {
        (this as { updateUIClasses: (c: Record<string, string>) => void }).updateUIClasses({
          mouse: 'pointer',
        });
        (this as { changeMode: (m: string, o: Record<string, unknown>) => void }).changeMode(
          'simple_select',
          { featureIds: [currentVertex] },
        );
      }
    },
    onTap: function (
      this: Record<string, unknown>,
      state: unknown,
      e: unknown,
    ): void {
      (this as { onClick: (s: unknown, ev: unknown) => void }).onClick(state, e);
    },
  };
}

export function createCircleMode(): Record<string, unknown> {
  return {
    onSetup: function (this: Record<string, unknown>): unknown {
      const circle = (this as { newFeature: (f: unknown) => unknown }).newFeature({
        type: 'Feature',
        properties: { shape: 'circle' },
        geometry: {
          type: 'Polygon',
          coordinates: [[]],
        },
      });
      (this as { addFeature: (f: unknown) => void }).addFeature(circle);
      (this as { clearSelectedFeatures: () => void }).clearSelectedFeatures();
      (this as { updateUIClasses: (c: Record<string, string>) => void }).updateUIClasses({
        mouse: 'add',
      });
      (this as { activateUIButton: (n: string) => void }).activateUIButton('Polygon');
      (this as { setActionableState: (s: Record<string, boolean>) => void }).setActionableState({
        trash: true,
      });
      return circle;
    },
    onClick: function (this: Record<string, unknown>): void {
      (this as { updateUIClasses: (c: Record<string, string>) => void }).updateUIClasses({
        mouse: 'add',
      });
      const currentVertex = (this as { getCurrent: () => { properties: { active: string } } }).getCurrent();
      if (currentVertex && currentVertex.properties.active !== 'true') {
        (this as { updateUIClasses: (c: Record<string, string>) => void }).updateUIClasses({
          mouse: 'pointer',
        });
        (this as { changeMode: (m: string, o: Record<string, unknown>) => void }).changeMode(
          'simple_select',
          { featureIds: [currentVertex] },
        );
      }
    },
    onTap: function (
      this: Record<string, unknown>,
      state: unknown,
      e: unknown,
    ): void {
      (this as { onClick: (s: unknown, ev: unknown) => void }).onClick(state, e);
    },
  };
}
