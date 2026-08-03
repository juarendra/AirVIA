import { describe, it, expect } from 'vitest';
import { serializeProfile, parseProfile, type KeyboardProfile } from './profile';

describe('Profile Serialization', () => {
  it('round-trips a valid profile', () => {
    const p: KeyboardProfile = { version: 1, name: 'Test', timestamp: 1234, keymap: [1, 2, 3] };
    const s = serializeProfile(p);
    const p2 = parseProfile(s);
    expect(p2).toEqual(p);
  });
  
  it('rejects invalid JSON', () => {
    expect(() => parseProfile('not json')).toThrow('Invalid profile data');
  });

  it('rejects profile without version', () => {
    expect(() => parseProfile('{}')).toThrow('Unsupported profile version');
  });
});
