import type { RawPacket } from '../core/protocol';
import type { CommandRequest } from '../core/commands';
import type { Transport, TransportState } from './transport';

const FRAME = 32;

export type SimulatorConfig = {
  name?: string;
  firmwareVersion?: number;
  rows?: number;
  cols?: number;
  layers?: number;
  encoders?: number;
  keymap?: number[];
  encoderMap?: number[];
  layoutOptions?: number;
  lighting?: { brightness: number; effect: number; speed: number; hue: number; saturation: number };
};

/**
 * In-memory model of a 0x000D (v13) VIA device speaking fixed 32-byte frames,
 * mirroring VIA_Protocol.cpp response layouts. Used for UI development without
 * hardware; it is not wired into the live BLE path.
 */
export class SimulatorTransport implements Transport {
  state: TransportState = 'connected';
  onResponse: ((pkt: RawPacket) => void) | null = null;
  onStateChange: ((s: TransportState) => void) | null = null;

  private name: string;
  private firmwareVersion: number;
  private rows: number;
  private cols: number;
  private layers: number;
  private encoders: number;
  private keymap: number[];
  private encoderMap: number[];
  private layoutOptions: number;
  private lighting: { brightness: number; effect: number; speed: number; hue: number; saturation: number };

  constructor(config: SimulatorConfig = {}) {
    this.name = config.name ?? 'AirVIA Sim';
    this.firmwareVersion = config.firmwareVersion ?? 0x00010000;
    this.rows = config.rows ?? 5;
    this.cols = config.cols ?? 6;
    this.layers = config.layers ?? 3;
    this.encoders = config.encoders ?? 1;

    const keyCount = this.layers * this.rows * this.cols;
    this.keymap = (config.keymap ?? new Array(keyCount).fill(0)).slice();
    while (this.keymap.length < keyCount) this.keymap.push(0);

    const encCount = this.layers * this.encoders * 2;
    this.encoderMap = (config.encoderMap ?? new Array(encCount).fill(0)).slice();
    while (this.encoderMap.length < encCount) this.encoderMap.push(0);

    this.layoutOptions = config.layoutOptions ?? 0;
    this.lighting = config.lighting ?? { brightness: 128, effect: 0, speed: 64, hue: 0, saturation: 255 };
  }

  private frame(...bytes: number[]): RawPacket {
    const p = new Array<number>(FRAME).fill(0);
    for (let i = 0; i < bytes.length && i < FRAME; i++) p[i] = bytes[i]!;
    return p;
  }

  private beU32(v: number): number[] {
    return [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff];
  }

  private keyIndex(layer: number, row: number, col: number): number {
    return (layer * this.rows + row) * this.cols + col;
  }

  private encIndex(layer: number, enc: number, cw: number): number {
    return (layer * this.encoders + enc) * 2 + cw;
  }

  async readInfo(): Promise<RawPacket | null> {
    // Info frame has no command byte: [0..3] = BE u32 firmware version, [4..] = name.
    const p = new Array<number>(FRAME).fill(0);
    const ver = this.beU32(this.firmwareVersion);
    for (let i = 0; i < 4; i++) p[i] = ver[i]!;
    const nameBytes = Array.from(this.name).map((c) => c.charCodeAt(0) & 0xff);
    for (let i = 0; i < nameBytes.length && 4 + i < FRAME; i++) p[4 + i] = nameBytes[i]!;
    return p;
  }

  async connect(): Promise<void> {
    this.state = 'connected';
    this.onStateChange?.(this.state);
  }

  async disconnect(): Promise<void> {
    this.state = 'disconnected';
    this.onStateChange?.(this.state);
  }

  private handle(data: number[]): RawPacket {
    const cmd = data[0]!;
    switch (cmd) {
      case 0x01: // get protocol version
        return this.frame(0x01, 0x00, 0x0d);

      case 0x02: { // get keyboard value
        const sub = data[1]!;
        if (sub === 0x01) return this.frame(0x02, 0x01, 0, 0, 0, 0); // uptime
        if (sub === 0x02) return this.frame(0x02, 0x02, ...this.beU32(this.layoutOptions));
        if (sub === 0x04) return this.frame(0x02, 0x04, ...this.beU32(this.firmwareVersion));
        if (sub === 0x06) return this.frame(0x02, 0x06, 0, 0, 0, 8); // QMK keycode 0.0.8
        return this.frame(0xff);
      }

      case 0x04: { // get keycode
        const layer = data[1]!; const row = data[2]!; const col = data[3]!;
        if (layer >= this.layers || row >= this.rows || col >= this.cols) return this.frame(0xff);
        const code = this.keymap[this.keyIndex(layer, row, col)]!;
        return this.frame(0x04, layer, row, col, (code >>> 8) & 0xff, code & 0xff);
      }

      case 0x05: { // set keycode
        const layer = data[1]!; const row = data[2]!; const col = data[3]!;
        if (layer >= this.layers || row >= this.rows || col >= this.cols) return this.frame(0xff);
        this.keymap[this.keyIndex(layer, row, col)] = (((data[4]! << 8) | data[5]!) >>> 0);
        return this.frame(0x05, layer, row, col, data[4]!, data[5]!);
      }

      case 0x08: { // get custom value (lighting)
        const sub = data[2]!;
        const value =
          sub === 0x01 ? this.lighting.brightness :
          sub === 0x02 ? this.lighting.effect :
          sub === 0x03 ? this.lighting.speed :
          sub === 0x04 ? this.lighting.hue :
          sub === 0x05 ? this.lighting.saturation :
          0;
        if (sub < 0x01 || sub > 0x05) return this.frame(0xff);
        return this.frame(0x08, data[1]!, sub, 0x00, value);
      }

      case 0x0c: return this.frame(0x0c, 0x00); // macro count
      case 0x0d: return this.frame(0x0d, 0x00, 0x00); // macro buffer size
      case 0x11: return this.frame(0x11, this.layers); // layer count

      case 0x12: { // get keymap buffer (byte stream of BE u16 keycodes)
        const offset = (data[1]! << 8) | data[2]!;
        const requested = Math.min(data[3]!, 28);
        const bytes: number[] = [];
        for (let i = 0; i < requested; i++) {
          const byteIdx = offset + i;
          const codeIdx = byteIdx >> 1; // floor(byteIdx / 2), as in firmware
          if (codeIdx >= this.keymap.length) {
            bytes.push(0);
            continue;
          }
          const code = this.keymap[codeIdx]!;
          bytes.push(byteIdx & 1 ? code & 0xff : (code >>> 8) & 0xff);
        }
        return this.frame(0x12, data[1]!, data[2]!, bytes.length, ...bytes);
      }

      case 0x13: { // set keymap buffer (aligned 2-byte writes)
        const offset = (data[1]! << 8) | data[2]!;
        const size = Math.min(data[3]!, 28);
        for (let i = 0; i + 1 < size; i += 2) {
          const codeIdx = (offset + i) >> 1;
          if (codeIdx >= this.keymap.length) break;
          this.keymap[codeIdx] = ((data[4 + i]! << 8) | (data[4 + i + 1]!)) >>> 0;
        }
        return this.frame(0x13, data[1]!, data[2]!, size);
      }

      case 0x14: { // get encoder keycode
        const layer = data[1]!; const enc = data[2]!; const cw = data[3]!;
        if (layer >= this.layers || enc >= this.encoders || cw > 1) return this.frame(0xff);
        const code = this.encoderMap[this.encIndex(layer, enc, cw)]!;
        return this.frame(0x14, layer, enc, cw, (code >>> 8) & 0xff, code & 0xff);
      }

      case 0x15: { // set encoder keycode
        const layer = data[1]!; const enc = data[2]!; const cw = data[3]!;
        if (layer >= this.layers || enc >= this.encoders || cw > 1) return this.frame(0xff);
        this.encoderMap[this.encIndex(layer, enc, cw)] = ((data[4]! << 8) | data[5]!) >>> 0;
        return this.frame(0x15, layer, enc, cw, data[4]!, data[5]!);
      }

      default:
        return this.frame(0xff);
    }
  }

  async sendPacket(data: number[]): Promise<RawPacket> {
    return this.handle(data);
  }

  async writePacket(packet: RawPacket): Promise<void> {
    const response = await this.sendPacket(packet);
    this.onResponse?.(response);
  }

  async sendCommand(request: CommandRequest): Promise<RawPacket> {
    return this.sendPacket(request.packet);
  }
}
