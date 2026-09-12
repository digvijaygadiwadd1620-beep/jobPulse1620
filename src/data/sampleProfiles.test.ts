import { describe, it, expect } from 'vitest';
import { SAMPLE_PROFILES } from './sampleProfiles';

describe('SAMPLE_PROFILES test suite', () => {
  it('contains valid candidate profiles with required fields', () => {
    expect(SAMPLE_PROFILES.length).toBeGreaterThan(0);

    SAMPLE_PROFILES.forEach((profile) => {
      expect(profile.id).toBeDefined();
      expect(profile.name.length).toBeGreaterThan(0);
      expect(profile.target_title.length).toBeGreaterThan(0);
      expect(Array.isArray(profile.skills)).toBe(true);
      expect(profile.skills.length).toBeGreaterThan(0);
      expect(typeof profile.years_experience).toBe('number');
    });
  });

  it('ensures at least one default active candidate profile exists', () => {
    const hasActive = SAMPLE_PROFILES.some((p) => p.is_active === 1);
    expect(hasActive).toBe(true);
  });
});
