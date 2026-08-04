// @ts-nocheck
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(resolve(__dirname, '../app.css'), 'utf-8');

describe('Dark Control Room theme', () => {
  it('defines the approved semantic tokens and reduced motion', () => {
    for (const token of ['--air-page', '--air-surface', '--air-raised', '--air-cyan', '--air-violet', '--air-lime', '--air-amber', '--air-red']) {
      expect(css).toContain(token);
    }
    expect(css).toContain('prefers-reduced-motion: reduce');
  });
});
