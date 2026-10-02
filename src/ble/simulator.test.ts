import { describe, it, expect } from 'vitest';
import { SimulatorTransport } from './simulator';

describe('SimulatorTransport', () => {
  it('reports protocol version 0x000D in a full 32-byte frame', async () => {
    const sim = new SimulatorTransport();
    const resp = await sim.sendPacket([0x01, 0x01, 0]);
    expect(resp.length).toBe(32);
    expect(resp[0]).toBe(0x01);
    expect(resp[1]).toBe(0x00);
    expect(resp[2]).toBe(0x0D);
  });

  it('reports the layer count at byte 1', async () => {
    const sim = new SimulatorTransport({ layers: 4 });
    const resp = await sim.sendPacket([0x11, 0, 0]);
    expect(resp[0]).toBe(0x11);
    expect(resp[1]).toBe(4);
  });

  it('serves the keymap buffer as a big-endian u16 byte stream', async () => {
    const sim = new SimulatorTransport({ rows: 1, cols: 2, layers: 1, keymap: [0x1234, 0xbeef] });
    const resp = await sim.sendPacket([0x12, 0x00, 0x00, 4]);
    expect(resp[0]).toBe(0x12);
    expect(resp[1]).toBe(0x00); // offset hi
    expect(resp[2]).toBe(0x00); // offset lo
    expect(resp[3]).toBe(4); // declared size
    expect(resp.slice(4, 8)).toEqual([0x12, 0x34, 0xbe, 0xef]);
  });

  it('round-trips set-keymap-buffer then get-keycode', async () => {
    const sim = new SimulatorTransport({ rows: 1, cols: 2, layers: 1 });
    await sim.sendPacket([0x13, 0x00, 0x00, 4, 0x00, 0x2a, 0x00, 0x41]);
    const resp = await sim.sendPacket([0x04, 0, 0, 1, 0]);
    expect(resp[0]).toBe(0x04);
    expect(resp[4]).toBe(0x00);
    expect(resp[5]).toBe(0x41);
  });

  it('answers layout options as a big-endian u32 at bytes 2..5', async () => {
    const sim = new SimulatorTransport({ layoutOptions: 0x00020101 });
    const resp = await sim.sendPacket([0x02, 0x02, 0]);
    expect(resp[0]).toBe(0x02);
    expect(resp[1]).toBe(0x02);
    expect(resp.slice(2, 6)).toEqual([0x00, 0x02, 0x01, 0x01]);
  });

  it('returns encoder keycodes at bytes 4..5', async () => {
    const sim = new SimulatorTransport({ encoders: 1, encoderMap: [0x0059, 0x005a] });
    const cw = await sim.sendPacket([0x14, 0, 0, 0, 0]);
    const ccw = await sim.sendPacket([0x14, 0, 0, 1, 0]);
    expect(cw[4]).toBe(0x00); expect(cw[5]).toBe(0x59);
    expect(ccw[4]).toBe(0x00); expect(ccw[5]).toBe(0x5a);
  });

  it('returns 0xFF for out-of-bounds keycode reads', async () => {
    const sim = new SimulatorTransport({ rows: 1, cols: 1, layers: 1 });
    const resp = await sim.sendPacket([0x04, 0, 0, 5, 0]);
    expect(resp[0]).toBe(0xff);
  });

  it('readInfo carries the firmware version and zero-padded name', async () => {
    const sim = new SimulatorTransport({ firmwareVersion: 0x00010203, name: 'ABC' });
    const info = (await sim.readInfo())!;
    expect(info.length).toBe(32);
    expect(info.slice(0, 4)).toEqual([0x00, 0x01, 0x02, 0x03]);
    expect(String.fromCharCode(...info.slice(4, 7))).toBe('ABC');
    expect(info[7]).toBe(0);
  });
});
