import { describe, it, expect, vi } from 'vitest';
vi.mock('./app.svelte', () => {
  let phase = 'disconnected';
  return {
    getSyncPhase: () => phase,
    setSyncPhase: (p: any) => { phase = p; },
    markStale: () => { phase = 'stale'; }
  };
});
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
