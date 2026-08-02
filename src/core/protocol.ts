export const PACKET_SIZE = 32;

export type RawPacket = number[];

export function createPacket(command: number, ...args: number[]): RawPacket {
  const packet: RawPacket = Array<number>(PACKET_SIZE).fill(0);
  packet[0] = command;
  for (let i = 0; i < Math.min(args.length, PACKET_SIZE - 1); i++) {
    packet[i + 1] = args[i]!;
  }
  return packet;
}

export function parseU32(packet: RawPacket, offset: number): number {
  return (
    ((packet[offset + 3]! << 24) |
      (packet[offset + 2]! << 16) |
      (packet[offset + 1]! << 8) |
      packet[offset]!) >>>
    0
  );
}

export function parseU16BE(packet: RawPacket, offset: number): number {
  return (((packet[offset]! << 8) | packet[offset + 1]!) >>> 0);
}

export function isError(packet: RawPacket): boolean {
  return packet[0] === 0xFF;
}

function bufferPacket(
  cmd: number,
  offset: number,
  data?: number[],
): RawPacket {
  const packet: RawPacket = Array<number>(PACKET_SIZE).fill(0);
  packet[0] = cmd;
  packet[1] = offset & 0xFF;
  packet[2] = (offset >>> 8) & 0xFF;
  if (data) {
    const capped = data.slice(0, 28);
    for (let i = 0; i < capped.length; i++) {
      packet[4 + i] = capped[i]!;
    }
  }
  return packet;
}

export class Protocol {
  static getProtocolVersion(): RawPacket {
    return createPacket(0x01);
  }

  static getUptime(): RawPacket {
    return createPacket(0x02, 0x01);
  }

  static getLayoutOptions(): RawPacket {
    return createPacket(0x02, 0x02);
  }

  static getMatrixState(startRow: number): RawPacket {
    return createPacket(0x02, 0x03, startRow);
  }

  static getFirmwareVersion(): RawPacket {
    return createPacket(0x02, 0x04);
  }

  static getQmkVersion(): RawPacket {
    return createPacket(0x02, 0x06);
  }

  static setDeviceIndication(value: number): RawPacket {
    return createPacket(0x03, 0x05, value);
  }

  static setLayoutOptions(options: number): RawPacket {
    return createPacket(
      0x03,
      0x02,
      (options >>> 24) & 0xFF,
      (options >>> 16) & 0xFF,
      (options >>> 8) & 0xFF,
      options & 0xFF,
    );
  }

  static getKeycode(
    layer: number,
    row: number,
    col: number,
  ): RawPacket {
    return createPacket(0x04, layer, row, col);
  }

  static setKeycode(
    layer: number,
    row: number,
    col: number,
    codeHi: number,
    codeLo: number,
  ): RawPacket {
    return createPacket(0x05, layer, row, col, codeHi, codeLo);
  }

  static resetKeymap(): RawPacket {
    return createPacket(0x06);
  }

  static setCustomValue(
    channel: number,
    sub: number,
    b3: number,
    b4: number = 0,
  ): RawPacket {
    return createPacket(0x07, channel, sub, b3, b4);
  }

  static getCustomValue(channel: number, sub: number): RawPacket {
    return createPacket(0x08, channel, sub);
  }

  static saveCustomValue(channel: number): RawPacket {
    return createPacket(0x09, channel);
  }

  static factoryReset(): RawPacket {
    return createPacket(0x0A);
  }

  static bootloaderJump(): RawPacket {
    return createPacket(0x0B);
  }

  static getMacroCount(): RawPacket {
    return createPacket(0x0C);
  }

  static getMacroBufferSize(): RawPacket {
    return createPacket(0x0D);
  }

  static getMacroBuffer(offset: number, size: number): RawPacket {
    return createPacket(0x0E, offset & 0xFF, (offset >>> 8) & 0xFF, size);
  }

  static setMacroBuffer(offset: number, data: number[]): RawPacket {
    return bufferPacket(0x0F, offset, data);
  }

  static resetMacros(): RawPacket {
    return createPacket(0x10);
  }

  static getLayerCount(): RawPacket {
    return createPacket(0x11);
  }

  static getKeymapBuffer(offset: number, size: number): RawPacket {
    return createPacket(0x12, offset & 0xFF, (offset >>> 8) & 0xFF, size);
  }

  static setKeymapBuffer(offset: number, data: number[]): RawPacket {
    return bufferPacket(0x13, offset, data);
  }

  static getEncoderKeycode(
    layer: number,
    encoder: number,
    clockwise: number,
  ): RawPacket {
    return createPacket(0x14, layer, encoder, clockwise);
  }

  static setEncoderKeycode(
    layer: number,
    encoder: number,
    clockwise: number,
    codeHi: number,
    codeLo: number,
  ): RawPacket {
    return createPacket(0x15, layer, encoder, clockwise, codeHi, codeLo);
  }
}
