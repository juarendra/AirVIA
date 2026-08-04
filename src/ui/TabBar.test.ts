import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import TabBar from './TabBar.svelte';
import { setActiveTab, getActiveTab } from '../store/app.svelte';

describe('TabBar', () => {
  beforeEach(() => {
    setActiveTab('keymap');
  });

  it('renders desktop group labels', () => {
    render(TabBar);
    expect(document.body.textContent).toContain('Configure');
    expect(document.body.textContent).toContain('Workspace');
    expect(document.body.textContent).toContain('Help');
  });

  it('includes Manual Pengguna label', () => {
    render(TabBar);
    expect(document.body.textContent).toContain('Manual Pengguna');
  });

  it('active destination has aria-current="page"', () => {
    const { container } = render(TabBar);
    const desktopNav = container.querySelector('[aria-label="Main navigation"]');
    const activeBtn = desktopNav!.querySelector('[aria-current="page"]');
    expect(activeBtn).toBeTruthy();
    expect(activeBtn!.textContent).toContain('Keymap');
  });

  it('renders 5 primary mobile buttons', () => {
    const { container } = render(TabBar);
    const primaryNav = container.querySelector('[aria-label="Primary navigation"]');
    expect(primaryNav).toBeTruthy();
    const buttons = primaryNav!.querySelectorAll('button');
    expect(buttons.length).toBe(6);
  });

  it('opens Advanced sheet', async () => {
    const { container } = render(TabBar);
    const moreBtn = container.querySelector('[aria-label="Primary navigation"] button:last-child')!;
    await fireEvent.click(moreBtn);
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog!.textContent).toContain('Profile Manager');
  });

  it('closes Advanced sheet', async () => {
    const { container } = render(TabBar);
    const moreBtn = container.querySelector('[aria-label="Primary navigation"] button:last-child')!;
    await fireEvent.click(moreBtn);
    const closeBtn = container.querySelector('[aria-label="Close"]')!;
    await fireEvent.click(closeBtn);
    expect(container.querySelector('[role="dialog"]')).toBeFalsy();
  });

  it('selects profiles from Advanced sheet', async () => {
    const { container } = render(TabBar);
    const moreBtn = container.querySelector('[aria-label="Primary navigation"] button:last-child')!;
    await fireEvent.click(moreBtn);
    const profilesBtn = Array.from(container.querySelectorAll('[role="dialog"] button'))
      .find(b => b.textContent?.includes('Profile Manager'))!;
    await fireEvent.click(profilesBtn);
    expect(getActiveTab()).toBe('profiles');
    expect(container.querySelector('[role="dialog"]')).toBeFalsy();
  });
});
