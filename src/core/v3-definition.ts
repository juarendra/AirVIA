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
    Array.isArray(l.keymap) && l.keymap.length > 0 && l.keymap.length <= m.rows * m.cols,
    'layouts.keymap must be non-empty array and length cannot exceed max keys (rows * cols)',
  );

  const rows = m.rows as number;
  const cols = m.cols as number;
  const seen = new Set<number>();

  for (let i = 0; i < l.keymap.length; i++) {
    const p = (l.keymap as unknown[])[i];
    assert(p != null && typeof p === 'object', `keymap[${i}] must be an object`);
    const kp = p as Record<string, unknown>;
    assert(typeof kp.x === 'number' && Number.isFinite(kp.x), `keymap[${i}].x must be a finite number`);
    assert(typeof kp.y === 'number' && Number.isFinite(kp.y), `keymap[${i}].y must be a finite number`);
    assert(
      kp.w === undefined || (typeof kp.w === 'number' && Number.isFinite(kp.w) && kp.w > 0),
      `keymap[${i}].w must be a finite number greater than 0 if present`,
    );
    assert(
      kp.h === undefined || (typeof kp.h === 'number' && Number.isFinite(kp.h) && kp.h > 0),
      `keymap[${i}].h must be a finite number greater than 0 if present`,
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
      row = (kp.matrix as number[])[0]!;
      col = (kp.matrix as number[])[1]!;
    } else {
      row = Math.floor(i / cols);
      col = i % cols;
      assert(row < rows, `implicit matrix coordinate [${row},${col}] at keymap index ${i} out of bounds [0, ${rows - 1}]`);
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

