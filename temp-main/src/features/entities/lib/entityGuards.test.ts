import { describe, expect, it } from 'vitest';
import { isTabooZoneEntity } from '@features/entities/lib/entityGuards';
import type { Entity } from '@features/entities/store/entitiesSlice';

function sectorEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: '1',
    type: 'sector',
    name: 'zone',
    category: '',
    color: '#fff',
    coordinates: [],
    visible: true,
    ...overrides,
  } as Entity;
}

describe('isTabooZoneEntity', () => {
  it('detects TABOOZONE category on sector entities', () => {
    expect(isTabooZoneEntity(sectorEntity({ category: 'TABOOZONE' as Entity['category'] }))).toBe(true);
  });

  it('detects legacy TABBOZON spelling', () => {
    expect(isTabooZoneEntity(sectorEntity({ name: 'TABBOZON' }))).toBe(true);
  });

  it('returns false for non-sector entities', () => {
    expect(isTabooZoneEntity(sectorEntity({ type: 'polygon', category: 'TABOOZONE' as Entity['category'] }))).toBe(
      false,
    );
  });
});
