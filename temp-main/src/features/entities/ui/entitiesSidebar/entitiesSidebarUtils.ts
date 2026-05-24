import { he } from '@shared/i18n';

export function pickNewMissionName(existing: string[]): string {
  const base = he.entities.newMission;
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base} (${i})`)) i += 1;
  return `${base} (${i})`;
}

export function pickMissionCopyName(sourceName: string, existing: string[]): string {
  const trimmed = String(sourceName || "").trim();
  const base = trimmed ? `${trimmed} ${he.entities.missionCopySuffix}` : he.entities.missionCopy;
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base} (${i})`)) i += 1;
  return `${base} (${i})`;
}

export { isTabooZoneEntity } from '@features/entities/lib/entityGuards';
