import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../app.css'), 'utf-8');

describe('Dark Control Room theme', () => {
  it('defines the approved semantic tokens and reduced motion', () => {
    for (const token of ['--air-page', '--air-surface', '--air-raised', '--air-cyan', '--air-violet', '--air-lime', '--air-amber', '--air-red']) {
      expect(css).toContain(token);
    }
    expect(css).toContain('prefers-reduced-motion: reduce');
  });
});
