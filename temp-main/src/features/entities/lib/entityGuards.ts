import type { Entity } from '@features/entities/store/entitiesSlice';

/** Detects taboo-zone sector entities (wire may spell category `TABBOZON` or `TABOOZONE`). */
export function isTabooZoneEntity(entity: Entity): boolean {
  const category = String(entity.category || '')
    .trim()
    .toUpperCase();
  const name = String(entity.name || '')
    .trim()
    .toUpperCase();
  return (
    entity.type === 'sector' &&
    (category === 'TABBOZON' ||
      category === 'TABOOZONE' ||
      name === 'TABBOZON' ||
      name === 'TABOOZONE')
  );
}
