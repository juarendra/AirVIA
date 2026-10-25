import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BLETransport, VIA_INFO_CHAR_UUID } from './transport';
import type { RawPacket } from '../core/protocol';

class Characteristic extends EventTarget {
  value: DataView | null = null;
  notificationsActive = false;
  startNotifications = vi.fn(async () => { this.notificationsActive = true; });
  stopNotifications = vi.fn(async () => { this.notificationsActive = false; });
  writeValueWithoutResponse = vi.fn().mockResolvedValue(undefined);
  readValue = vi.fn().mockResolvedValue(new DataView(new ArrayBuffer(32)));

  notify(packet: RawPacket) {
    this.value = new DataView(Uint8Array.from(packet).buffer);
    this.dispatchEvent(new Event('characteristicvaluechanged'));
  }
}

function request(transport: BLETransport) {
  return transport.sendCommand({
    packet: [0x01, ...new Array(31).fill(0)],
    matches: packet => packet[0] === 0x01,
    decode: <T>(packet: RawPacket) => packet as unknown as T,
    resolve: () => {},
    reject: () => {},
  });
}

describe('BLE connection lifecycle', () => {
  let device: EventTarget;
  let data: Characteristic;
  let server: BluetoothRemoteGATTServer & { connected: boolean };
  let transports: BLETransport[];

  beforeEach(() => {
    vi.useFakeTimers();
    transports = [];
    device = new EventTarget();
    data = new Characteristic();
    const info = new Characteristic();
    server = {
      connected: false,
      connect: async () => { server.connected = true; return server; },
      disconnect: () => { server.connected = false; },
      getPrimaryService: async () => {
        if (data.notificationsActive) throw new Error('Previous notification session still active');
        return {
          getCharacteristic: async (uuid: string) => uuid === VIA_INFO_CHAR_UUID ? info : data,
        };
      },
    };
    Object.assign(device, { gatt: server });
    vi.stubGlobal('navigator', {
      bluetooth: { requestDevice: vi.fn().mockResolvedValue(device) },
    });
  });

  afterEach(async () => {
    await Promise.all(transports.map(t => t.disconnect()));
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function connect() {
    const transport = new BLETransport();
    transports.push(transport);
    await transport.connect();
    return transport;
  }

  it('rejects pending requests on disconnect and ignores a late disconnect after reconnect', async () => {
    const first = await connect();
    const pending = request(first);
    const cancelled = expect(pending).rejects.toThrow('Disconnected');
    await first.disconnect();
    await cancelled;
    expect(server.connected).toBe(true);  // Keep the OS keyboard's shared link.
    expect(data.notificationsActive).toBe(false);

    const second = await connect();
    const reply = request(second);
    const result = reply.catch(error => error);
    await Promise.resolve();

    // The same BluetoothDevice may deliver an old event after GATT reconnects.
    device.dispatchEvent(new Event('gattserverdisconnected'));
    expect(second.state).toBe('connected');

    const packet = [0x01, 0x00, 0x0d, ...new Array(29).fill(0)];
    data.notify(packet);
    expect(await result).toEqual(packet);
  });

  it('does not establish GATT after disconnect cancels the chooser result', async () => {
    const transport = new BLETransport();
    transports.push(transport);
    vi.mocked(navigator.bluetooth.requestDevice).mockImplementationOnce(async () => {
      await transport.disconnect();
      return device as unknown as BluetoothDevice;
    });
    await expect(transport.connect()).rejects.toMatchObject({ name: 'AbortError' });
    expect(transport.state).toBe('disconnected');
    expect(server.connected).toBe(false);
  });

  it('rejects an in-flight request when the current GATT connection really drops', async () => {
    const transport = await connect();
    const pending = request(transport);
    const cancelled = expect(pending).rejects.toThrow('Disconnected');
    server.connected = false;
    device.dispatchEvent(new Event('gattserverdisconnected'));
    await cancelled;
    expect(transport.state).toBe('disconnected');
  });
});
