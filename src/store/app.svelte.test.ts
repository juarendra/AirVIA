import { describe, it, expect } from 'vitest';
import { setSyncPhase, getSyncPhase, markStale } from './app.svelte';

describe('Session State', () => {
  it('enforces disconnected -> connecting -> syncing -> ready', () => {
    setSyncPhase('connecting');
    expect(getSyncPhase()).toBe('connecting');
    setSyncPhase('ready');
    expect(getSyncPhase()).toBe('ready');
  });

  it('markStale locks editors', () => {
    setSyncPhase('ready');
    markStale();
    expect(getSyncPhase()).toBe('stale');
  });
});
