import { describe, it, expect } from 'vitest';
import { Protocol, createPacket, parseU32, parseU16BE, isError, PACKET_SIZE } from './protocol';

describe('createPacket', () => {
  it('produces exactly 32 bytes', () => {
    const pkt = createPacket(0x01);
    expect(pkt.length).toBe(PACKET_SIZE);
    expect(pkt.every((b) => b >= 0 && b <= 255)).toBe(true);
  });

  it('fills command at byte 0 and args starting at byte 1', () => {
    const pkt = createPacket(0x05, 1, 2, 3, 0xAB, 0xCD);
    expect(pkt[0]).toBe(0x05);
    expect(pkt[1]).toBe(1);
    expect(pkt[2]).toBe(2);
    expect(pkt[3]).toBe(3);
    expect(pkt[4]).toBe(0xAB);
    expect(pkt[5]).toBe(0xCD);
    expect(pkt[6]).toBe(0);
  });

  it('zero-pads remaining bytes', () => {
    const pkt = createPacket(0x10);
    for (let i = 1; i < PACKET_SIZE; i++) {
      expect(pkt[i]).toBe(0);
    }
  });
});

describe('parseU32', () => {
  it('parses little-endian u32', () => {
    const by = [0x78, 0x56, 0x34, 0x12, 0, 0];
    expect(parseU32(by, 0)).toBe(0x12345678);
  });
});

describe('parseU16BE', () => {
  it('parses big-endian u16', () => {
    const by = [0x12, 0x34];
    expect(parseU16BE(by, 0)).toBe(0x1234);
  });
});

describe('isError', () => {
  it('detects 0xFF command byte as error', () => {
    const ok = createPacket(0x01);
    const err = createPacket(0xFF);
    expect(isError(ok)).toBe(false);
    expect(isError(err)).toBe(true);
  });
});

describe('Protocol', () => {
  it('getProtocolVersion produces 0x01', () => {
    expect(Protocol.getProtocolVersion()[0]).toBe(0x01);
  });

  it('setKeycode packs codeHi/codeLo into byte 4 and 5', () => {
    const pkt = Protocol.setKeycode(0, 1, 2, 0x12, 0x34);
    expect(pkt[0]).toBe(0x05);
    expect(pkt[1]).toBe(0);
    expect(pkt[2]).toBe(1);
    expect(pkt[3]).toBe(2);
    expect(pkt[4]).toBe(0x12);
    expect(pkt[5]).toBe(0x34);
  });

  it('setEncoderKeycode packs codeHi/codeLo into byte 4 and 5', () => {
    const pkt = Protocol.setEncoderKeycode(2, 0, 1, 0xAB, 0xCD);
    expect(pkt[0]).toBe(0x15);
    expect(pkt[1]).toBe(2);
    expect(pkt[2]).toBe(0);
    expect(pkt[3]).toBe(1);
    expect(pkt[4]).toBe(0xAB);
    expect(pkt[5]).toBe(0xCD);
  });

  it('setLayoutOptions packs 4 bytes big-endian', () => {
    const pkt = Protocol.setLayoutOptions(0x01020304);
    expect(pkt[0]).toBe(0x03);
    expect(pkt[1]).toBe(0x02);
    expect(pkt[2]).toBe(0x01);
    expect(pkt[3]).toBe(0x02);
    expect(pkt[4]).toBe(0x03);
    expect(pkt[5]).toBe(0x04);
  });

  it('setCustomValue uses b4 default 0', () => {
    const pkt = Protocol.setCustomValue(1, 2, 3);
    expect(pkt[0]).toBe(0x07);
    expect(pkt[1]).toBe(1);
    expect(pkt[2]).toBe(2);
    expect(pkt[3]).toBe(3);
    expect(pkt[4]).toBe(0);
  });

  it('getCustomValue', () => {
    const pkt = Protocol.getCustomValue(0xAA, 0xBB);
    expect(pkt[0]).toBe(0x08);
    expect(pkt[1]).toBe(0xAA);
    expect(pkt[2]).toBe(0xBB);
  });

  it('saveCustomValue', () => {
    const pkt = Protocol.saveCustomValue(5);
    expect(pkt[0]).toBe(0x09);
    expect(pkt[1]).toBe(5);
  });

  it('factoryReset, bootloaderJump, resetKeymap, resetMacros are zero-arg', () => {
    expect(Protocol.factoryReset()[0]).toBe(0x0A);
    expect(Protocol.bootloaderJump()[0]).toBe(0x0B);
    expect(Protocol.resetKeymap()[0]).toBe(0x06);
    expect(Protocol.resetMacros()[0]).toBe(0x10);
  });

  it('getMacroCount, getMacroBufferSize, getLayerCount', () => {
    expect(Protocol.getMacroCount()[0]).toBe(0x0C);
    expect(Protocol.getMacroBufferSize()[0]).toBe(0x0D);
    expect(Protocol.getLayerCount()[0]).toBe(0x11);
  });

  it('getUptime, getLayoutOptions, getFirmwareVersion, getQmkVersion', () => {
    expect(Protocol.getUptime()[0]).toBe(0x02);
    expect(Protocol.getUptime()[1]).toBe(0x01);
    expect(Protocol.getLayoutOptions()[0]).toBe(0x02);
    expect(Protocol.getLayoutOptions()[1]).toBe(0x02);
    expect(Protocol.getFirmwareVersion()[0]).toBe(0x02);
    expect(Protocol.getFirmwareVersion()[1]).toBe(0x04);
    expect(Protocol.getQmkVersion()[0]).toBe(0x02);
    expect(Protocol.getQmkVersion()[1]).toBe(0x06);
  });

  it('getMatrixState packs startRow', () => {
    const pkt = Protocol.getMatrixState(7);
    expect(pkt[0]).toBe(0x02);
    expect(pkt[1]).toBe(0x03);
    expect(pkt[2]).toBe(7);
  });

  it('setDeviceIndication', () => {
    const pkt = Protocol.setDeviceIndication(1);
    expect(pkt[0]).toBe(0x03);
    expect(pkt[1]).toBe(0x05);
    expect(pkt[2]).toBe(1);
  });

  it('setMacroBuffer caps data at 28 bytes (payload after header)', () => {
    const data = Array.from({ length: 50 }, (_, i) => i);
    const pkt = Protocol.setMacroBuffer(0x00, data);
    expect(pkt[0]).toBe(0x0F);
    expect(pkt[1]).toBe(0x00);
    expect(pkt[2]).toBe(0x00);
    for (let i = 0; i < 28; i++) {
      expect(pkt[4 + i]).toBe(i);
    }
    expect(pkt[32]).toBeUndefined();
    expect(pkt[31]).toBe(27);
  });

  it('setMacroBuffer writes offset as little-endian u16', () => {
    const pkt = Protocol.setMacroBuffer(0x1234, []);
    expect(pkt[1]).toBe(0x34);
    expect(pkt[2]).toBe(0x12);
  });

  it('setKeymapBuffer caps data at 28 bytes (payload after header)', () => {
    const data = Array.from({ length: 40 }, (_, i) => i + 100);
    const pkt = Protocol.setKeymapBuffer(0x200, data);
    expect(pkt[0]).toBe(0x13);
    expect(pkt[1]).toBe(0x00);
    expect(pkt[2]).toBe(0x02);
    for (let i = 0; i < 28; i++) {
      expect(pkt[4 + i]).toBe(i + 100);
    }
    expect(pkt[32]).toBeUndefined();
  });

  it('getMacroBuffer packs offset LE u16 and size', () => {
    const pkt = Protocol.getMacroBuffer(0xABCD, 5);
    expect(pkt[0]).toBe(0x0E);
    expect(pkt[1]).toBe(0xCD);
    expect(pkt[2]).toBe(0xAB);
    expect(pkt[3]).toBe(5);
  });

  it('getKeymapBuffer packs offset LE u16 and size', () => {
    const pkt = Protocol.getKeymapBuffer(0x300, 10);
    expect(pkt[0]).toBe(0x12);
    expect(pkt[1]).toBe(0x00);
    expect(pkt[2]).toBe(0x03);
    expect(pkt[3]).toBe(10);
  });
});
