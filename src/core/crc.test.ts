import { describe, it, expect } from 'vitest';
import { crc32 } from './crc';

describe('crc32', () => {
  it('returns 0 for empty input', () => {
    expect(crc32(new Uint8Array(0))).toBe(0);
  });

  it('matches known value for "123456789"', () => {
    const data = new TextEncoder().encode('123456789');
    expect(crc32(data)).toBe(0xCBF43926 >>> 0);
  });

  it('matches via protocol state magic', () => {
    const state = new Uint8Array([0x41, 0x41, 0x49, 0x56]);
    expect(crc32(state)).toBe(0xD007073E >>> 0);
  });

  it('produces different values for different inputs', () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([1, 2, 4]);
    expect(crc32(a)).not.toBe(crc32(b));
  });
});
