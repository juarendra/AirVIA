// Requires Chrome 122+ with Web Bluetooth API enabled. No automated tests.

import { type RawPacket, PACKET_SIZE } from '../core/protocol';
import { PacketQueue } from './queue';
import { type CommandRequest } from '../core/commands';

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
  #queue = new PacketQueue({ retries: 3, maxDepth: 8 });
  #timeoutId: ReturnType<typeof setTimeout> | null = null;

  get state(): TransportState {
    return this.#state;
  }

  #setState(s: TransportState) {
    this.#state = s;
    this.onStateChange?.(s);
  }

  async writePacket(packet: RawPacket): Promise<void> {
    if (!this.#dataChar) throw new Error('Not connected');
    await this.#dataChar.writeValueWithoutResponse(new Uint8Array(packet));
  }

  async connect(): Promise<void> {
    this.#setState('connecting');

    try {
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
        if (this.#state !== 'error') this.#setState('disconnected');
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
    } catch (err) {
      await this.#cleanup();
      this.#setState('error');
      throw err;
    }
  }

  async #cleanup(): Promise<void> {
    this.#clearTimeout();
    this.#queue.clear();
    try { this.#device?.gatt?.disconnect(); } catch { /* already disconnected */ }
    this.#device = null;
    this.#server = null;
    this.#dataChar = null;
    this.#infoChar = null;
  }

  async disconnect(): Promise<void> {
    await this.#cleanup();
    this.#setState('disconnected');
  }

  async sendCommand(request: CommandRequest): Promise<RawPacket> {
    const promise = new Promise<RawPacket>((resolve, reject) => {
      // Create a wrapper that captures the promise callbacks
      const proxyRequest: CommandRequest = {
        ...request,
        resolve: (val: unknown) => {
          this.#clearTimeout(); // clear timeout when resolved
          resolve(val as RawPacket);
        },
        reject: (err: Error) => {
          this.#clearTimeout(); // clear timeout when rejected
          reject(err);
        }
      };
      
      try {
        this.#queue.enqueue(proxyRequest);
        this.#_flush().catch(reject);
      } catch (err) {
        reject(err);
      }
    });
    
    return promise;
  }

  async readInfo(): Promise<RawPacket | null> {
    if (!this.#infoChar) return null;
    const dv = await this.#infoChar.readValue();
    if (!dv) return null;
    return Array.from(new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength));
  }

  #onNotification(evt: Event) {
    if (this.#state !== 'connected') return;
    const dv = (evt.target as unknown as BluetoothRemoteGATTCharacteristic).value;
    if (!dv || dv.byteLength !== PACKET_SIZE) return;
    const packet: RawPacket = Array.from(new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength));
    this.#queue.handleResponse(packet);
    this.#_flush();
    this.onResponse?.(packet);
  }

  async #_flush(): Promise<void> {
    const pktReq = this.#queue.takeForSend();
    if (!pktReq || !this.#dataChar) return;

    try {
      await this.#dataChar.writeValueWithoutResponse(new Uint8Array(pktReq));
      this.#queue.markSent();
    } catch (err) {
      // Pass the rejection to the specific request that failed
      this.#queue.handleError(err as Error);
      this.#_flush();
      return;
    }

    this.#clearTimeout();
    // In our new architecture we don't know the exact timeout of the request here 
    // unless we retrieve the current request from the queue.
    // Instead we just use a sensible retry interval (500ms).
    
    this.#timeoutId = setTimeout(() => {
      const retried = this.#queue.retry();
      if (retried) {
        this.#_flush();
      }
    }, 500); // Still retry relatively quickly for reliability
  }

  #clearTimeout(): void {
    if (this.#timeoutId !== null) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = null;
    }
  }
}
