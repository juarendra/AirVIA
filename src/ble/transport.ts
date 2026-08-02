// Requires Chrome 122+ with Web Bluetooth API enabled. No automated tests.

import { type RawPacket, PACKET_SIZE } from '../core/protocol';
import { PacketQueue } from './queue';

export const VIA_SERVICE_UUID = '0000ff60-0000-1000-8000-00805f9b34fb';
export const VIA_DATA_CHAR_UUID = '0000ff61-0000-1000-8000-00805f9b34fb';
export const VIA_INFO_CHAR_UUID = '0000ff62-0000-1000-8000-00805f9b34fb';

export type TransportState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export class BLETransport {
  onResponse: ((pkt: RawPacket) => void) | null = null;
  onStateChange: ((s: TransportState) => void) | null = null;

  #state: TransportState = 'disconnected';
  #device: BluetoothDevice | null = null;
  #server: BluetoothRemoteGATTServer | null = null;
  #dataChar: BluetoothRemoteGATTCharacteristic | null = null;
  #infoChar: BluetoothRemoteGATTCharacteristic | null = null;
  #queue = new PacketQueue({ retries: 3, timeoutMs: 500, maxDepth: 8 });
  #timeoutId: ReturnType<typeof setTimeout> | null = null;

  get state(): TransportState {
    return this.#state;
  }

  #setState(s: TransportState) {
    this.#state = s;
    this.onStateChange?.(s);
  }

  async connect(): Promise<void> {
    this.#setState('connecting');

    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [VIA_SERVICE_UUID] }],
    });
    this.#device = device;

    device.addEventListener('gattserverdisconnected', () => {
      this.#queue.clear();
      this.#clearTimeout();
      this.#server = null;
      this.#dataChar = null;
      this.#infoChar = null;
      this.#setState('disconnected');
    });

    const server = await device.gatt!.connect();
    this.#server = server;

    const service = await server.getPrimaryService(VIA_SERVICE_UUID);
    this.#infoChar = await service.getCharacteristic(VIA_INFO_CHAR_UUID);
    this.#dataChar = await service.getCharacteristic(VIA_DATA_CHAR_UUID);

    await this.#dataChar.startNotifications();
    this.#dataChar.addEventListener(
      'characteristicvaluechanged',
      (evt: Event) => this.#onNotification(evt),
    );

    await this.#dataChar.readValue();
    this.#setState('connected');
  }

  disconnect(): void {
    this.#queue.clear();
    this.#clearTimeout();
    this.#server?.disconnect();
  }

  send(packet: RawPacket): void {
    this.#queue.enqueue(packet);
    this.#_flush();
  }

  async readInfo(): Promise<RawPacket | null> {
    if (!this.#infoChar) return null;
    const dv = await this.#infoChar.readValue();
    if (!dv) return null;
    return Array.from(new Uint8Array(dv.buffer));
  }

  #onNotification(evt: Event) {
    const dv = (evt.target as BluetoothRemoteGATTCharacteristic).value;
    if (!dv || dv.byteLength !== PACKET_SIZE) return;
    const packet: RawPacket = Array.from(new Uint8Array(dv.buffer));
    this.#queue.resolve(packet);
    this.#_flush();
    this.onResponse?.(packet);
  }

  #_flush(): void {
    // ponytail: global timeout, per-packet timers if reordering matters
    const pkt = this.#queue.flush();
    if (!pkt || !this.#dataChar) return;

    this.#dataChar.writeValueWithoutResponse(new Uint8Array(pkt));
    this.#clearTimeout();
    this.#timeoutId = setTimeout(() => {
      this.#queue.timeout();
      this.#_flush();
    }, 500);
  }

  #clearTimeout(): void {
    if (this.#timeoutId !== null) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = null;
    }
  }
}
