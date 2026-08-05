import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import DefinitionOnboarding from './DefinitionOnboarding.svelte';
import BrowserCheckWrapper from '../shared/__BrowserCheckTestWrapper.svelte';

describe('DefinitionOnboarding', () => {
  it('renders Load V3 definition title', () => {
    render(DefinitionOnboarding, { onLoad: vi.fn() });
    expect(document.body.textContent).toContain('Load V3 definition');
  });

  it('explains accepted format', () => {
    render(DefinitionOnboarding, { onLoad: vi.fn() });
    expect(document.body.textContent).toContain('.json');
  });

  it('renders load button that calls onLoad', async () => {
    const onLoad = vi.fn();
    render(DefinitionOnboarding, { onLoad });
    const btn = document.body.querySelector('button');
    expect(btn).toBeTruthy();
    await fireEvent.click(btn!);
    expect(onLoad).toHaveBeenCalledOnce();
  });

  it('renders manual link to Manual Pengguna tab', () => {
    render(DefinitionOnboarding, { onLoad: vi.fn() });
    expect(document.body.textContent).toContain('Manual Pengguna');
  });
});

describe('BrowserCheck non-blocking', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders children when bluetooth is missing and shows warning', () => {
    vi.stubGlobal('navigator', {});
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    render(BrowserCheckWrapper, { text: 'Hello offline' });
    expect(document.body.textContent).toContain('Hello offline');
    expect(document.body.textContent).toContain('Bluetooth not available');
  });

  it('renders children when bluetooth is available', () => {
    vi.stubGlobal('navigator', { bluetooth: {} });
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    render(BrowserCheckWrapper, { text: 'Hello offline' });
    expect(document.body.textContent).toContain('Hello offline');
    expect(document.body.textContent).not.toContain('Bluetooth not available');
  });
});
