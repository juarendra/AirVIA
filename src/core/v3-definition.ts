/// <reference types="vitest" />

export type V3KeyPosition = { x: number; y: number; w?: number; h?: number; r?: number; rx?: number; ry?: number; row: number; col: number };

export type V3Layout = { keymap: V3KeyPosition[]; labels?: (string | string[])[] };

export type V3Definition = {
  name: string;
  vendorId: string;
  productId: string;
  matrix: { rows: number; cols: number };
  layouts: V3Layout;
  encoders?: number;
};

export class V3ParseError extends Error {
  name = 'V3ParseError';
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new V3ParseError(message);
}

export function parseV3Definition(json: string): V3Definition {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new V3ParseError('Invalid JSON');
  }

  assert(raw != null && typeof raw === 'object', 'Root must be an object');
  const obj = raw as Record<string, unknown>;

  assert(typeof obj.name === 'string' && obj.name.length > 0, 'Missing or empty "name"');
  assert(typeof obj.vendorId === 'string' && obj.vendorId.length > 0, 'Missing or empty "vendorId"');
  assert(typeof obj.productId === 'string' && obj.productId.length > 0, 'Missing or empty "productId"');

  const matrix = obj['matrix'];
  assert(matrix != null && typeof matrix === 'object', 'Missing "matrix"');
  const m = matrix as Record<string, unknown>;
  assert(typeof m.rows === 'number' && Number.isInteger(m.rows) && m.rows > 0, 'matrix.rows must be positive integer');
  assert(typeof m.cols === 'number' && Number.isInteger(m.cols) && m.cols > 0, 'matrix.cols must be positive integer');
  assert(m.rows <= 32, 'matrix.rows exceeds max 32');
  assert(m.cols <= 32, 'matrix.cols exceeds max 32');

  const layouts = obj['layouts'];
  assert(layouts != null && typeof layouts === 'object', 'Missing "layouts"');
  const l = layouts as Record<string, unknown>;
  assert(
    Array.isArray(l.keymap) && l.keymap.length > 0,
    'layouts.keymap must be non-empty array',
  );

  const rows = m.rows as number;
  const cols = m.cols as number;
  const seen = new Set<number>();

  for (let i = 0; i < l.keymap.length; i++) {
    const p = (l.keymap as unknown[])[i];
    assert(p != null && typeof p === 'object', `keymap[${i}] must be an object`);
    const kp = p as Record<string, unknown>;
    assert(typeof kp.x === 'number', `keymap[${i}].x must be a number`);
    assert(typeof kp.y === 'number', `keymap[${i}].y must be a number`);
    assert(
      kp.w === undefined || typeof kp.w === 'number',
      `keymap[${i}].w must be a number if present`,
    );
    assert(
      kp.h === undefined || typeof kp.h === 'number',
      `keymap[${i}].h must be a number if present`,
    );
    assert(
      kp.r === undefined || typeof kp.r === 'number',
      `keymap[${i}].r must be a number if present`,
    );
    assert(
      kp.rx === undefined || typeof kp.rx === 'number',
      `keymap[${i}].rx must be a number if present`,
    );
    assert(
      kp.ry === undefined || typeof kp.ry === 'number',
      `keymap[${i}].ry must be a number if present`,
    );

    if (kp.matrix !== undefined) {
      assert(
        Array.isArray(kp.matrix) && kp.matrix.length === 2 &&
        typeof kp.matrix[0] === 'number' && Number.isInteger(kp.matrix[0]) &&
        typeof kp.matrix[1] === 'number' && Number.isInteger(kp.matrix[1]),
        `keymap[${i}].matrix must be [row, col]`,
      );
      const mRow = kp.matrix[0] as number;
      const mCol = kp.matrix[1] as number;
      assert(mRow >= 0 && mRow < rows, `keymap[${i}].matrix row ${mRow} out of bounds [0, ${rows - 1}]`);
      assert(mCol >= 0 && mCol < cols, `keymap[${i}].matrix col ${mCol} out of bounds [0, ${cols - 1}]`);
    }
  }

  const keymap = (l.keymap as unknown[]).map((p, i) => {
    const kp = p as Record<string, unknown>;
    let row: number;
    let col: number;
    if (kp.matrix !== undefined) {
      row = (kp.matrix as number[])[0];
      col = (kp.matrix as number[])[1];
    } else {
      row = Math.floor(i / cols);
      col = i % cols;
    }
    const key = row * cols + col;
    assert(!seen.has(key), `Duplicate matrix coordinate [${row},${col}] at keymap index ${i}`);
    seen.add(key);
    const entry: V3KeyPosition = { x: kp.x as number, y: kp.y as number, row, col };
    if (typeof kp.w === 'number') entry.w = kp.w;
    if (typeof kp.h === 'number') entry.h = kp.h;
    if (typeof kp.r === 'number') entry.r = kp.r;
    if (typeof kp.rx === 'number') entry.rx = kp.rx;
    if (typeof kp.ry === 'number') entry.ry = kp.ry;
    return entry;
  });

  const layout: V3Layout = { keymap };

  if (l.labels !== undefined) {
    assert(Array.isArray(l.labels), 'layouts.labels must be an array if present');
    const labels = l.labels as unknown[];
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      assert(
        typeof label === 'string' || (Array.isArray(label) && label.every((s) => typeof s === 'string')),
        `layouts.labels[${i}] must be string or string[]`,
      );
    }
    layout.labels = labels as (string | string[])[];
  }

  const def: V3Definition = {
    name: obj.name as string,
    vendorId: obj.vendorId as string,
    productId: obj.productId as string,
    matrix: { rows: m.rows, cols: m.cols },
    layouts: layout,
  };

  if (obj.encoders !== undefined) {
    assert(
      typeof obj.encoders === 'number' && Number.isInteger(obj.encoders) && obj.encoders >= 0,
      'encoders must be non-negative integer',
    );
    def.encoders = obj.encoders;
  }

  return def;
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

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
    f: (r: number, c: number) => V3KeyPosition,
  ): V3KeyPosition[] {
    const arr: V3KeyPosition[] = [];
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
}
