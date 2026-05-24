import { describe, expect, it } from 'vitest';
import { emptyMapServiceRuntime } from '@/services/map/mapServiceRuntime';

describe('emptyMapServiceRuntime', () => {
  it('returns empty entity collections', () => {
    expect(emptyMapServiceRuntime.getAllEntities()).toEqual([]);
    expect(emptyMapServiceRuntime.getEntitiesForMap()).toEqual({});
  });

  it('provides default marker icon', () => {
    expect(emptyMapServiceRuntime.getSelectedMarkerIcon()).toBe('E7BA');
  });
});
