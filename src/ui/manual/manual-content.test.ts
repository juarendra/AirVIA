import { describe, expect, it } from 'vitest';
import { manualSections, searchManual, type ManualSection } from './manual-content.js';

describe('manual-content completeness', () => {
  it('has exactly 17 unique section IDs', () => {
    const ids = manualSections.map((s: ManualSection) => s.id);
    expect(ids.length).toBe(17);
    expect(new Set(ids).size).toBe(17);
  });

  it('first section is "Mulai Cepat"', () => {
    expect(manualSections[0]!.title).toBe('Mulai Cepat');
  });

  it('last section is "Keterbatasan RC dan Perangkat Keras"', () => {
    expect(manualSections[manualSections.length - 1]!.title).toBe('Keterbatasan RC dan Perangkat Keras');
  });

  it('every section has summary, keywords, and blocks', () => {
    for (const section of manualSections) {
      expect(section.summary, `${section.id}: summary missing`).toBeTruthy();
      expect(section.keywords, `${section.id}: keywords missing`).toBeTruthy();
      expect(section.keywords.length, `${section.id}: keywords empty`).toBeGreaterThan(0);
      expect(section.blocks, `${section.id}: blocks missing`).toBeTruthy();
      expect(section.blocks.length, `${section.id}: blocks empty`).toBeGreaterThan(0);
    }
  });
});

describe('searchManual', () => {
  it('blank query returns all sections', () => {
    expect(searchManual('')).toHaveLength(17);
    expect(searchManual('   ')).toHaveLength(17);
  });

  it('unknown search returns empty array', () => {
    expect(searchManual('xyznonexistent123')).toEqual([]);
  });

  it('search by title ("macro") returns expected sections', () => {
    const results = searchManual('macro');
    const titles = results.map((s: ManualSection) => s.title);
    expect(titles).toContain('Macro');
  });

  it('search by keyword ("bluetooth") returns expected sections', () => {
    const results = searchManual('bluetooth');
    const titles = results.map((s: ManualSection) => s.title);
    expect(titles).toContain('Pemecahan Masalah BLE');
  });

  it('search by body text ("simulator") returns expected sections', () => {
    const results = searchManual('simulator');
    const titles = results.map((s: ManualSection) => s.title);
    // simulator mentioned in RC/hardware limitations and possibly Mulai Cepat
    expect(titles.length).toBeGreaterThan(0);
  });
});
