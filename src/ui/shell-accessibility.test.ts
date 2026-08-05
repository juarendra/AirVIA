import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import TabBar from './TabBar.svelte';
import { setActiveTab } from '../store/app.svelte';

describe('shell accessibility', () => {
  beforeEach(() => {
    setActiveTab('manual');
  });

  it('has one main navigation landmark on desktop', () => {
    const { container } = render(TabBar);
    const mainNav = container.querySelector('nav[aria-label="Main navigation"]');
    expect(mainNav).toBeTruthy();
    const allNavs = container.querySelectorAll('nav');
    expect(allNavs.length).toBeGreaterThanOrEqual(2); // main + primary
  });

  it('primary mobile nav is labelled', () => {
    const { container } = render(TabBar);
    const primaryNav = container.querySelector('nav[aria-label="Primary navigation"]');
    expect(primaryNav).toBeTruthy();
  });

  it('active destination has aria-current="page"', () => {
    const { container } = render(TabBar);
    const currentBtns = container.querySelectorAll('[aria-current="page"]');
    expect(currentBtns.length).toBeGreaterThanOrEqual(1);
    expect(currentBtns[0]!.textContent).toContain('Manual');
  });

  it('Manual Pengguna destination is visible in desktop rail', () => {
    render(TabBar);
    expect(document.body.textContent).toContain('Manual Pengguna');
  });

  it('Advanced sheet is reachable via More button', async () => {
    const { container } = render(TabBar);
    const moreBtn = container.querySelector('[aria-label="Primary navigation"] button:last-child');
    expect(moreBtn).toBeTruthy();
    expect(moreBtn!.getAttribute('title')).toBe('More');
    await fireEvent.click(moreBtn!);
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog!.getAttribute('aria-label')).toBe('Advanced navigation');
  });

  it('no button relies solely on icon without accessible name', () => {
    const { container } = render(TabBar);
    const buttons = container.querySelectorAll('button');
    for (const btn of buttons) {
      const hasLabel = btn.getAttribute('aria-label') != null;
      const hasTitle = btn.getAttribute('title') != null;
      const hasText = (btn.textContent ?? '').trim().length > 0;
      const ok = hasLabel || hasTitle || hasText;
      expect(ok, `button missing accessible name: ${btn.outerHTML.slice(0, 120)}`).toBe(true);
    }
  });

  it('sheet Close button has aria-label', async () => {
    const { container } = render(TabBar);
    const moreBtn = container.querySelector('[aria-label="Primary navigation"] button:last-child')!;
    await fireEvent.click(moreBtn);
    const closeBtn = container.querySelector('[aria-label="Close"]');
    expect(closeBtn).toBeTruthy();
  });
});
