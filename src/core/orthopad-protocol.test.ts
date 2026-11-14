import { describe, expect, it } from 'vitest';
import {
  crc16Ccitt,
  decodeOrthoPadFrame,
  encodeOrthoPadFrame,
  OrthoPadFrameDecoder,
  OrthoPadFlags,
} from './orthopad-protocol';

describe('OrthoPad protocol', () => {
  it('round-trips frames and CRC', () => {
    const encoded = encodeOrthoPadFrame({
      version: 1,
      flags: OrthoPadFlags.Response,
      sequence: 42,
      command: 0x20,
      payload: Uint8Array.of(0, 1, 2, 255),
    });
    expect(decodeOrthoPadFrame(encoded)).toEqual({
      version: 1,
      flags: OrthoPadFlags.Response,
      sequence: 42,
      command: 0x20,
      payload: Uint8Array.of(0, 1, 2, 255),
    });
  });

  it('decodes fragmented and concatenated frames', () => {
    const first = encodeOrthoPadFrame({ version: 1, flags: 0, sequence: 1, command: 1, payload: Uint8Array.of(8) });
    const second = encodeOrthoPadFrame({ version: 1, flags: 0, sequence: 2, command: 2, payload: Uint8Array.of(9, 10) });
    const decoder = new OrthoPadFrameDecoder();
    expect(decoder.push(first.slice(0, 4))).toEqual([]);
    expect(decoder.push(new Uint8Array([...first.slice(4), ...second]))).toEqual([
      { version: 1, flags: 0, sequence: 1, command: 1, payload: Uint8Array.of(8) },
      { version: 1, flags: 0, sequence: 2, command: 2, payload: Uint8Array.of(9, 10) },
    ]);
  });

  it('resynchronizes after garbage and bad CRC', () => {
    const valid = encodeOrthoPadFrame({ version: 1, flags: 0, sequence: 7, command: 1, payload: Uint8Array.of(1) });
    const bad = valid.slice();
    bad[bad.length - 1] = (bad[bad.length - 1] ?? 0) ^ 0xff;
    const decoder = new OrthoPadFrameDecoder();
    expect(decoder.push(new Uint8Array([1, 2, 3, ...bad, ...valid]))).toEqual([
      { version: 1, flags: 0, sequence: 7, command: 1, payload: Uint8Array.of(1) },
    ]);
  });

  it('uses CRC-16/CCITT-FALSE parameters', () => {
    expect(crc16Ccitt(new TextEncoder().encode('123456789'))).toBe(0x29b1);
  });
});
