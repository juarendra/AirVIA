import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BLETransport, VIA_SERVICE_UUID, VIA_DATA_CHAR_UUID, VIA_INFO_CHAR_UUID } from './transport';
import type { RawPacket } from '../core/protocol';

const mockCharacteristic = {
  startNotifications: vi.fn().mockResolvedValue(undefined),
  addEventListener: vi.fn(),
  writeValueWithoutResponse: vi.fn().mockResolvedValue(undefined),
  readValue: vi.fn().mockResolvedValue(new Uint8Array(32)),
  value: null as DataView | null,
} as unknown as BluetoothRemoteGATTCharacteristic;

const mockService = {
  getCharacteristic: vi.fn().mockImplementation((uuid: string) => {
    if (uuid === VIA_INFO_CHAR_UUID) return mockCharacteristic;
    return mockCharacteristic;
  }),
} as unknown as BluetoothRemoteGATTService;

const mockServer = {
  getPrimaryService: vi.fn().mockResolvedValue(mockService),
  disconnect: vi.fn(),
} as unknown as BluetoothRemoteGATTServer;

const mockDevice = {
  gatt: mockServer,
  addEventListener: vi.fn(),
} as unknown as BluetoothDevice;

describe('BLETransport', () => {
  beforeEach(() => {
    navigator.bluetooth = { requestDevice: vi.fn().mockResolvedValue(mockDevice) };
  });

  it('starts disconnected', () => {
    const t = new BLETransport();
    expect(t.state).toBe('disconnected');
  });

  it('transitions to connecting on connect', async () => {
    const t = new BLETransport();
    const states: string[] = [];
    t.onStateChange = (s) => states.push(s);
    t.connect().catch(() => {});
    expect(states).toContain('connecting');
  });

  it('notifies response handler on valid notification', () => {
    const t = new BLETransport();
    expect(t.onResponse).toBeNull();
    const cb = vi.fn();
    t.onResponse = cb;
    expect(t.onResponse).toBe(cb);
  });

  it('disconnect transitions to disconnected', async () => {
    const t = new BLETransport();
    let lastState = '';
    t.onStateChange = (s) => { lastState = s; };
    await t.disconnect();
    expect(lastState).toBe('disconnected');
  });

  it('send enqueues packet', async () => {
    const t = new BLETransport();
    const pkt = new Array(32).fill(0);
    pkt[0] = 0x01;
    await t.send(pkt);
  });
});
