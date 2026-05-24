import { describe, expect, it } from 'vitest';
import { sortHebrew } from '@shared/i18n/locale';

describe('sortHebrew', () => {
  it('sorts Hebrew strings with locale rules', () => {
    const sorted = ['תמר', 'אביב', 'בן'].sort(sortHebrew);
    expect(sorted[0]).toBe('אביב');
  });
});
