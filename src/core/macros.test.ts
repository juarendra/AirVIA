import { describe, expect, it } from 'vitest';
import { decodeMacroSlots, macroText, replaceMacroText } from './macros';

describe('QMK macro slot encoding', () => {
  it('starts M0 at byte zero and preserves a binary chord in M1', () => {
    const chord = [1, 2, 224, 1, 1, 6, 1, 3, 224];
    const buffer = [...'old'].map(c => c.charCodeAt(0)).concat(0, chord, 0, [90, 0]);
    while (buffer.length < 40) buffer.push(0);
    const encoded = replaceMacroText(buffer, 3, 0, 'Hi!\n');
    const slots = decodeMacroSlots(encoded, 3);
    expect(slots).toEqual([[72, 105, 33, 10], chord, [90]]);
    expect(macroText(slots[1] ?? [])).toBeNull();
    expect(encoded[encoded.length - 1]).toBe(0);
  });
  it('counts every terminator, including empty slots, against shared capacity', () => {
    expect(replaceMacroText([0, 0, 0, 0], 2, 1, 'ab')).toEqual([0, 97, 98, 0]);
    expect(() => replaceMacroText([0, 0, 0, 0], 2, 1, 'abc')).toThrow('exceed');
    expect(decodeMacroSlots([0, 0, 0], 3)).toEqual([[], [], []]);
  });
  it('rejects truncated slots, invalid indices and text firmware cannot type', () => {
    expect(() => decodeMacroSlots([97, 0, 98], 2)).toThrow('Unterminated');
    expect(() => replaceMacroText([0, 0], 2, 2, 'a')).toThrow('Invalid macro slot');
    for (const text of ['é', '😀', '\u0000', '\u0001']) {
      expect(() => replaceMacroText(new Array(20).fill(0), 2, 0, text)).toThrow('US ASCII');
    }
    expect(() => decodeMacroSlots([256, 0], 1)).toThrow('Invalid macro buffer');
  });
});
