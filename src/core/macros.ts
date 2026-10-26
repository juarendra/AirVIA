export function decodeMacroSlots(buffer: readonly number[], count: number): number[][] {
  if (!Number.isInteger(count) || count < 0 || count > 128 || buffer.length < count ||
      buffer.some(byte => !Number.isInteger(byte) || byte < 0 || byte > 255)) {
    throw new Error('Invalid macro buffer');
  }
  const slots: number[][] = [];
  let offset = 0;
  while (slots.length < count) {
    const end = buffer.indexOf(0, offset);
    if (end < 0) throw new Error('Unterminated macro slot');
    slots.push(buffer.slice(offset, end));
    offset = end + 1;
  }
  return slots;
}

export function macroText(bytes: readonly number[]): string | null {
  return bytes.every(byte => byte === 9 || byte === 10 || (byte >= 32 && byte <= 126))
    ? String.fromCharCode(...bytes)
    : null;
}

export function replaceMacroText(buffer: readonly number[], count: number,
                                 slot: number, text: string): number[] {
  const slots = decodeMacroSlots(buffer, count);
  if (!Number.isInteger(slot) || slot < 0 || slot >= count) throw new Error('Invalid macro slot');
  const bytes = Array.from(text, character => character.charCodeAt(0));
  if (macroText(bytes) === null) throw new Error('Use US ASCII text, tab and newline only');
  slots[slot] = bytes;
  const result = slots.flatMap(bytes => [...bytes, 0]);
  if (result.length > buffer.length) throw new Error(`Macros exceed ${buffer.length} bytes`);
  while (result.length < buffer.length) result.push(0);
  return result;
}
