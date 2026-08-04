import { describe, expect, it } from 'vitest';
import { destinationById, navigationGroups, primaryMobileDestinations } from './navigation';

describe('navigation model', () => {
  it('groups primary, workspace, advanced, and manual destinations', () => {
    expect(navigationGroups.map(group => group.label)).toEqual(['Configure', 'Workspace', 'Advanced', 'Help']);
    expect(destinationById('manual')?.label).toBe('Manual Pengguna');
    expect(primaryMobileDestinations.map(item => item.id)).toEqual(['keymap', 'encoder', 'lighting', 'macros', 'manual']);
  });
});
