import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Transport, TransportState } from '../ble/transport';
import type { CommandRequest } from '../core/commands';
import type { RawPacket } from '../core/protocol';
import { setTransport } from '../ble/dispatch';
import { replaceMacroText } from '../core/macros';
import { resetDeviceState, setConnectionState, setSyncPhase, setMacroCount, setMacroBytes, setMacroBuffer, getMacroBuffer, markDirty, getPendingChanges } from '../store/app.svelte';
import { saveMacroBuffer } from './macros';

class MacroDevice implements Transport {
  readonly state: TransportState = 'connected';
  onResponse = null;
  onStateChange = null;
  buffer: number[];
  durable: number[];
  calls = 0;
  unsafeWrite = false;
  rejectCommit = false;
  corruptRead = false;
  afterWrite: (() => void) | null = null;
  constructor(initial: number[]) { this.buffer = [...initial]; this.durable = [...initial]; }
  async connect(): Promise<void> { throw new Error('Not used by this device fixture'); }
  async disconnect(): Promise<void> { throw new Error('Not used by this device fixture'); }
  async writePacket(): Promise<void> { throw new Error('Use queued VIA commands'); }
  async readInfo(): Promise<RawPacket | null> { return null; }
  async sendCommand(request: CommandRequest): Promise<RawPacket> {
    this.calls++;
    const packet = request.packet;
    const high = packet[1], low = packet[2], size = packet[3];
    if (high === undefined || low === undefined || size === undefined) throw new Error('Truncated request');
    const offset = (high << 8) | low;
    if (packet[0] === 0x0F) {
      if (offset < this.buffer.length - 1 && this.buffer[this.buffer.length - 1] === 0) this.unsafeWrite = true;
      this.buffer.splice(offset, size, ...packet.slice(4, 4 + size));
      this.afterWrite?.();
      return [...packet];
    }
    if (packet[0] === 0x09) {
      if (this.rejectCommit) throw new Error('Commit failed');
      this.durable = [...this.buffer];
      return [...packet];
    }
    if (packet[0] === 0x0E) {
      const response = new Array(32).fill(0);
      response.splice(0, 4 + size, ...packet.slice(0, 4), ...this.buffer.slice(offset, offset + size));
      if (this.corruptRead && offset === 0) response[4] ^= 1;
      return response;
    }
    throw new Error('Unexpected command');
  }
}
let initial: number[];
let device: MacroDevice;
beforeEach(() => {
  initial = [111,108,100,0,1,2,224,1,1,6,1,3,224,0,116,97,105,108,0];
  while (initial.length < 64) initial.push(0);
  device = new MacroDevice(initial);
  resetDeviceState();
  setConnectionState('connected'); setSyncPhase('ready');
  setMacroCount(3); setMacroBytes(64); setMacroBuffer([...initial]); setTransport(device);
});
afterEach(() => setTransport(null));

describe('macro upload and verification', () => {
  it('guards partial playback, commits/readbacks all slots and preserves unrelated dirty edits', async () => {
    markDirty();
    const next = replaceMacroText(initial, 3, 0, 'new\n');
    await saveMacroBuffer(next, new AbortController().signal);
    expect(device.unsafeWrite).toBe(false);
    expect(device.durable).toEqual(next);
    expect(getMacroBuffer()).toEqual(next);
    expect(getPendingChanges()).toBe(1);
  });
  it('does not publish a failed commit as saved', async () => {
    device.rejectCommit = true;
    await expect(saveMacroBuffer(replaceMacroText(initial, 3, 0, 'new'), new AbortController().signal)).rejects.toThrow('Commit failed');
    expect(device.durable).toEqual(initial);
    expect(getMacroBuffer()).toEqual(initial);
  });
  it('does not publish mismatching readback', async () => {
    device.corruptRead = true;
    await expect(saveMacroBuffer(replaceMacroText(initial, 3, 0, 'new'), new AbortController().signal)).rejects.toThrow('readback differs');
    expect(getMacroBuffer()).toEqual(initial);
  });
  it('stops immediately when the active device changes during a response', async () => {
    const other = new MacroDevice(initial);
    device.afterWrite = () => setTransport(other);
    await expect(saveMacroBuffer(replaceMacroText(initial, 3, 0, 'new'), new AbortController().signal)).rejects.toThrow('session changed');
    expect(other.calls).toBe(0);
    expect(other.buffer).toEqual(initial);
    expect(getMacroBuffer()).toEqual(initial);
  });
  it('does not start an upload after cancellation', async () => {
    const abort = new AbortController(); abort.abort();
    await expect(saveMacroBuffer(initial, abort.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(device.calls).toBe(0);
    expect(device.buffer).toEqual(initial);
  });
});
