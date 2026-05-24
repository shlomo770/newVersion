import { describe, expect, it } from 'vitest';
import { pickNewMissionName, pickMissionCopyName } from '@features/entities/ui/entitiesSidebar/entitiesSidebarUtils';

describe('mission name helpers', () => {
  it('returns base name when unused', () => {
    expect(pickNewMissionName([])).toBe('משימה חדשה');
  });

  it('increments duplicate mission names', () => {
    expect(pickNewMissionName(['משימה חדשה'])).toBe('משימה חדשה (2)');
  });

  it('builds copy name with Hebrew suffix', () => {
    expect(pickMissionCopyName('Alpha', [])).toBe('Alpha העתק');
  });
});
