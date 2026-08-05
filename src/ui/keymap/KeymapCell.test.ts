import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import type { SelectedTarget } from '../../store/app.svelte';
import KeymapCell from './KeymapCell.svelte';

const { keycodeAt, getKeycodeLabel, getSelectedTarget, setSelectedTarget } = vi.hoisted(() => ({
  keycodeAt: vi.fn<() => number>(),
  getKeycodeLabel: vi.fn<() => string>(),
  getSelectedTarget: vi.fn<() => SelectedTarget | null>(),
  setSelectedTarget: vi.fn(),
}));

vi.mock('../../store/app.svelte', () => ({
  keycodeAt,
  getKeycodeLabel,
  getSelectedTarget,
  setSelectedTarget,
}));

describe('KeymapCell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    keycodeAt.mockReturnValue(0x0004);
    getKeycodeLabel.mockReturnValue('KC_A');
    getSelectedTarget.mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders accessible key label containing keycode', () => {
    render(KeymapCell, { props: { layer: 0, row: 0, col: 0 } });
    const btn = screen.getByRole('button');
    expect(btn).toBeDefined();
    expect(btn.title).toContain('KC_A');
  });

  it('shows KC_NO keycode with muted display', () => {
    keycodeAt.mockReturnValue(0x0000);
    getKeycodeLabel.mockReturnValue('KC_NO');
    render(KeymapCell, { props: { layer: 0, row: 1, col: 0 } });
    const btn = screen.getByRole('button');
    expect(btn.title).toContain('KC_NO');
    expect(btn.textContent).toContain('NO');
  });

  it('shows KC_TRNS keycode', () => {
    keycodeAt.mockReturnValue(0x0001);
    getKeycodeLabel.mockReturnValue('KC_TRNS');
    render(KeymapCell, { props: { layer: 0, row: 2, col: 0 } });
    const btn = screen.getByRole('button');
    expect(btn.title).toContain('KC_TRNS');
  });

  it('uses aria-pressed="true" when selected', () => {
    getSelectedTarget.mockReturnValue({ type: 'key', layer: 0, row: 0, col: 0 });
    render(KeymapCell, { props: { layer: 0, row: 0, col: 0 } });
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('does not set aria-pressed when not selected', () => {
    getSelectedTarget.mockReturnValue({ type: 'key', layer: 0, row: 1, col: 1 });
    render(KeymapCell, { props: { layer: 0, row: 0, col: 0 } });
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  it('keyboard Enter selects the target', async () => {
    render(KeymapCell, { props: { layer: 0, row: 0, col: 0 } });
    const btn = screen.getByRole('button');
    await fireEvent.keyDown(btn, { key: 'Enter' });
    expect(setSelectedTarget).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'key', layer: 0, row: 0, col: 0 }),
    );
  });

  it('keyboard Space selects the target', async () => {
    render(KeymapCell, { props: { layer: 0, row: 0, col: 0 } });
    const btn = screen.getByRole('button');
    await fireEvent.keyDown(btn, { key: ' ' });
    expect(setSelectedTarget).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'key', layer: 0, row: 0, col: 0 }),
    );
  });
});
