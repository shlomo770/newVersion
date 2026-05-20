import type { Entity } from '@features/entities/store/entitiesSlice';

export function pickNewMissionName(existing: string[]): string {
  const base = "משימה חדשה";
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base} (${i})`)) i += 1;
  return `${base} (${i})`;
}

export function pickMissionCopyName(sourceName: string, existing: string[]): string {
  const trimmed = String(sourceName || "").trim();
  const base = trimmed ? `${trimmed} העתק` : "משימה העתק";
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base} (${i})`)) i += 1;
  return `${base} (${i})`;
}

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
