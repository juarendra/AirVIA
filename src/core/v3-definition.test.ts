import { describe, it, expect } from 'vitest';
import { parseV3Definition, V3ParseError } from './v3-definition';

function validJson(overrides?: Record<string, unknown>): string {
  return JSON.stringify({
    name: 'TestBoard',
    vendorId: '0xFEED',
    productId: '0xBEEF',
    matrix: { rows: 2, cols: 3 },
    layouts: {
      keymap: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
        { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
      ],
    },
    ...overrides,
  });
}

function keymapOfLength(
  rows: number,
  cols: number,
  f: (r: number, c: number) => Record<string, unknown>,
): Record<string, unknown>[] {
  const arr: Record<string, unknown>[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      arr.push(f(r, c));
    }
  }
  return arr;
}

describe('parseV3Definition', () => {
  it('parses valid V3 JSON', () => {
    const def = parseV3Definition(validJson());
    expect(def.name).toBe('TestBoard');
    expect(def.vendorId).toBe('0xFEED');
    expect(def.productId).toBe('0xBEEF');
    expect(def.matrix.rows).toBe(2);
    expect(def.matrix.cols).toBe(3);
    expect(def.layouts.keymap.length).toBe(6);
    expect(def.layouts.keymap[0]).toEqual({ x: 0, y: 0, row: 0, col: 0 });
    expect(def.encoders).toBeUndefined();
  });

  it('parses valid V3 JSON with encoders', () => {
    const def = parseV3Definition(validJson({ encoders: 2 }));
    expect(def.encoders).toBe(2);
  });

  it('parses keymap with optional fields', () => {
    const def = parseV3Definition(validJson({
      layouts: {
        keymap: [
          { x: 0, y: 0, w: 2, h: 1 },
          { x: 2, y: 0, r: 90, rx: 1, ry: 0 },
          { x: 3, y: 0 },
          { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
        ],
      },
    }));
    expect(def.layouts.keymap[0]).toEqual({ x: 0, y: 0, w: 2, h: 1, row: 0, col: 0 });
    expect(def.layouts.keymap[1]).toEqual({ x: 2, y: 0, r: 90, rx: 1, ry: 0, row: 0, col: 1 });
  });

  it('parses labels string array', () => {
    const def = parseV3Definition(validJson({
      layouts: {
        keymap: keymapOfLength(2, 3, (r, c) => ({ x: c, y: r })),
        labels: ['A', 'B', 'C', 'D', 'E', 'F'],
      },
    }));
    expect(def.layouts.labels).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
  });

  it('parses labels nested arrays', () => {
    const def = parseV3Definition(validJson({
      layouts: {
        keymap: keymapOfLength(2, 3, (r, c) => ({ x: c, y: r })),
        labels: [['Top', 'Left'], 'B', 'C', 'D', 'E', 'F'],
      },
    }));
    expect(def.layouts.labels![0]).toEqual(['Top', 'Left']);
  });

  it('rejects missing name', () => {
    expect(() => parseV3Definition(validJson({ name: undefined })))
      .toThrow(V3ParseError);
  });

  it('rejects empty name', () => {
    expect(() => parseV3Definition(validJson({ name: '' })))
      .toThrow(V3ParseError);
  });

  it('rejects invalid JSON', () => {
    expect(() => parseV3Definition('{not json}')).toThrow(V3ParseError);
  });

  it('parses keys with explicit matrix coordinates', () => {
    const def = parseV3Definition(validJson({
      layouts: {
        keymap: [
          { x: 3, y: 0, matrix: [0, 0] },
          { x: 8, y: 0, matrix: [0, 1] },
          { x: 0, y: 2, w: 1.5, matrix: [1, 0] },
          { x: 2, y: 2, w: 2.75, matrix: [1, 1] },
        ],
      },
    }));
    expect(def.layouts.keymap.length).toBe(4);
    expect(def.layouts.keymap[0]).toEqual({ x: 3, y: 0, row: 0, col: 0 });
    expect(def.layouts.keymap[1]).toEqual({ x: 8, y: 0, row: 0, col: 1 });
    expect(def.layouts.keymap[2]).toEqual({ x: 0, y: 2, w: 1.5, row: 1, col: 0 });
    expect(def.layouts.keymap[3]).toEqual({ x: 2, y: 2, w: 2.75, row: 1, col: 1 });
  });

  it('parses sparse keymap with fewer keys than matrix size', () => {
    const def = parseV3Definition(validJson({
      matrix: { rows: 3, cols: 4 },
      layouts: {
        keymap: [
          { x: 0, y: 0, matrix: [0, 0] },
          { x: 1, y: 0, matrix: [0, 2] },
          { x: 0, y: 1, matrix: [2, 1] },
        ],
      },
    }));
    expect(def.layouts.keymap.length).toBe(3);
    expect(def.layouts.keymap[0]).toEqual({ x: 0, y: 0, row: 0, col: 0 });
    expect(def.layouts.keymap[1]).toEqual({ x: 1, y: 0, row: 0, col: 2 });
    expect(def.layouts.keymap[2]).toEqual({ x: 0, y: 1, row: 2, col: 1 });
  });

  it('rejects out-of-bounds matrix row', () => {
    expect(() => parseV3Definition(validJson({
      layouts: {
        keymap: [
          { x: 0, y: 0, matrix: [2, 0] },
          { x: 1, y: 0, matrix: [0, 1] },
          { x: 2, y: 0, matrix: [0, 2] },
          { x: 0, y: 1, matrix: [1, 0] },
          { x: 1, y: 1, matrix: [1, 1] },
          { x: 2, y: 1, matrix: [1, 2] },
        ],
      },
    }))).toThrow('out of bounds');
  });

  it('rejects duplicate matrix coordinates', () => {
    expect(() => parseV3Definition(validJson({
      layouts: {
        keymap: [
          { x: 0, y: 0, matrix: [0, 0] },
          { x: 1, y: 0, matrix: [0, 1] },
          { x: 2, y: 0, matrix: [0, 0] },
          { x: 0, y: 1, matrix: [1, 0] },
          { x: 1, y: 1, matrix: [1, 1] },
          { x: 2, y: 1, matrix: [1, 2] },
        ],
      },
    }))).toThrow('Duplicate matrix coordinate');
  });

  it('rejects oversized matrix rows', () => {
    expect(() => parseV3Definition(validJson({
      matrix: { rows: 33, cols: 3 },
      layouts: {
        keymap: keymapOfLength(33, 3, (r, c) => ({ x: c, y: r })),
      },
    }))).toThrow('matrix.rows exceeds max 32');
  });

  it('rejects oversized matrix cols', () => {
    expect(() => parseV3Definition(validJson({
      matrix: { rows: 2, cols: 33 },
      layouts: {
        keymap: keymapOfLength(2, 33, (r, c) => ({ x: c, y: r })),
      },
    }))).toThrow('matrix.cols exceeds max 32');
  });

  it('rejects missing vendorId', () => {
    expect(() => parseV3Definition(validJson({ vendorId: undefined })))
      .toThrow(V3ParseError);
  });

  it('rejects missing productId', () => {
    expect(() => parseV3Definition(validJson({ productId: undefined })))
      .toThrow(V3ParseError);
  });

  it('rejects non-integer encoders', () => {
    expect(() => parseV3Definition(validJson({ encoders: 2.5 })))
      .toThrow(V3ParseError);
  });

  it('rejects negative encoders', () => {
    expect(() => parseV3Definition(validJson({ encoders: -1 })))
      .toThrow(V3ParseError);
  });

  it('verifies all typed fields populated', () => {
    const def = parseV3Definition(validJson({
      encoders: 3,
      layouts: {
        keymap: keymapOfLength(2, 3, (r, c) => ({ x: c, y: r, w: 1 })),
        labels: ['Esc', '1', '2', 'Tab', 'Q', 'W'],
      },
    }));
    expect(def.name).toBe('TestBoard');
    expect(def.vendorId).toBe('0xFEED');
    expect(def.productId).toBe('0xBEEF');
    expect(def.matrix).toEqual({ rows: 2, cols: 3 });
    expect(def.encoders).toBe(3);
    expect(def.layouts.keymap.length).toBe(6);
    expect(def.layouts.labels).toEqual(['Esc', '1', '2', 'Tab', 'Q', 'W']);
  });
});
