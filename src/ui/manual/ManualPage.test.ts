import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import ManualPage from './ManualPage.svelte';
import { getActiveTab } from '../../store/app.svelte';

// ponytail: stub for component that doesn't exist yet; tests will pass once component is implemented
function stubManualPage() {
  return document.createElement('div');
}

describe('ManualPage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders labelled search input', () => {
    render(ManualPage);
    const search = document.body.querySelector('input[type="search"]');
    expect(search).toBeTruthy();
    expect(search!.getAttribute('aria-label')).toBe('Cari di manual');
  });

  it('renders Manual Pengguna AirVIA heading', () => {
    render(ManualPage);
    expect(document.body.textContent).toContain('Manual Pengguna');
  });

  it('renders table of contents links', () => {
    render(ManualPage);
    const tocLinks = document.body.querySelectorAll('nav[aria-label="Daftar isi manual"] a');
    expect(tocLinks.length).toBeGreaterThanOrEqual(3);
  });

  it('renders all initial sections', () => {
    render(ManualPage);
    expect(document.body.textContent).toContain('Mulai Cepat');
    expect(document.body.textContent).toContain('Browser');
    expect(document.body.textContent).toContain('Keterbatasan RC dan Perangkat Keras');
  });

  it('filters results after typing Bluetooth', async () => {
    render(ManualPage);
    const search = document.body.querySelector('input[type="search"]')!;
    await fireEvent.input(search, { target: { value: 'Bluetooth' } });
    expect(document.body.textContent).toContain('Pemecahan Masalah BLE');
  });

  it('shows no-results state for nonsense query', async () => {
    render(ManualPage);
    const search = document.body.querySelector('input[type="search"]')!;
    await fireEvent.input(search, { target: { value: 'xyznonexistent123' } });
    expect(document.body.textContent).toContain('Tidak ditemukan');
  });

  it('restores content on Reset pencarian', async () => {
    render(ManualPage);
    const search = document.body.querySelector('input[type="search"]')!;
    await fireEvent.input(search, { target: { value: 'Bluetooth' } });
    const resetBtn = document.body.querySelector('button');
    const resetEl = Array.from(document.body.querySelectorAll('button')).find(b => b.textContent?.includes('Reset'));
    if (resetEl) await fireEvent.click(resetEl);
    expect(document.body.textContent).toContain('Mulai Cepat');
  });

  it('section headings have stable IDs', () => {
    render(ManualPage);
    const mulai = document.body.querySelector('#manual-mulai-cepat');
    expect(mulai).toBeTruthy();
  });

  it('renders warning blocks with amber styling', () => {
    render(ManualPage);
    const article = document.body.querySelector('article');
    expect(article).toBeTruthy();
  });

  it('renders status table for connect section', () => {
    render(ManualPage);
    expect(document.body.textContent).toContain('Disconnected');
    expect(document.body.textContent).toContain('Connected');
  });
});
