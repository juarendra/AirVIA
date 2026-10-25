import { beforeEach, describe, expect, it } from 'vitest';
import {
  getKeymap, getLayerCount, getMacroBuffer, getSelectedTarget, getSyncPhase,
  markStale, resetDeviceState, setKeymap, setLayerCount, setMacroBuffer,
  setSelectedTarget, setSyncPhase,
} from './app.svelte';

describe('Device session snapshot', () => {
  beforeEach(() => {
    resetDeviceState();
    setLayerCount(1);
    setKeymap([0x0004, 0x0005]);
    setMacroBuffer([65, 0]);
    setSelectedTarget({ type: 'key', layer: 0, row: 0, col: 1 });
    setSyncPhase('ready');
  });

  it('keeps the last keymap visible but clears the editable target when disconnected', () => {
    markStale();
    expect(getSyncPhase()).toBe('stale');
    expect(getLayerCount()).toBe(1);
    expect(getKeymap()).toEqual([0x0004, 0x0005]);
    expect(getSelectedTarget()).toBeNull();
  });

  it('does not carry mapped keys or macro data into a replacement device snapshot', () => {
    resetDeviceState();
    expect(getKeymap()).toEqual([]);
    expect(getLayerCount()).toBe(0);
    expect(getMacroBuffer()).toBeNull();
    expect(getSelectedTarget()).toBeNull();
  });
});
