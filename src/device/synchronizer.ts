import type { RawPacket } from '../core/protocol';
import { Protocol } from '../core/protocol';
import {
  decodeLayerCount,
  decodeBufferChunk,
  decodeMacroCount,
  decodeMacroBufferSize,
  decodeLayoutOptions,
} from '../core/commands';
import { sendViaCommand } from '../ble/dispatch';
import {
  getDefinition,
  setSyncPhase,
  setSyncProgress,
  setProtocolVersion,
} from '../store/app.svelte';

export type DeviceSnapshot = {
  layers: number;
  keymap: number[];
  encoders?: number[];
  lighting?: { brightness: number; effect: number; speed: number; hue: number; saturation: number };
  layoutOptions?: number;
  macros?: { count: number; bytes: number; buffer: number[] };
};

// Minimum VIA protocol version this app can drive (v12 devices lack the
// dynamic-keymap buffer but are rejected below; v13 firmware reports 0x000D).
const MIN_PROTOCOL_VERSION = 0x000C;

export async function synchronizeDevice(): Promise<DeviceSnapshot> {
  const def = getDefinition();
  if (!def) throw new Error('No definition loaded');

  setSyncPhase('syncing');
  setSyncProgress('Verifying protocol version');

  // 0. Verify protocol version
  let version = 0;
  try {
    const protoResp = await sendViaCommand(Protocol.getProtocolVersion());
    version = ((protoResp[1] ?? 0) << 8) | (protoResp[2] ?? 0);
    if (version < MIN_PROTOCOL_VERSION) {
      throw new Error('Unsupported VIA protocol version on device');
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'Unsupported VIA protocol version on device') {
      throw err;
    }
    throw new Error('Failed to verify device compatibility');
  }
  setProtocolVersion(version);

  // 1. Get layer count
  const layerResp = await sendViaCommand(Protocol.getLayerCount());
  const layers = decodeLayerCount(layerResp);
  if (!layers || layers < 1) throw new Error('Invalid layer count');

  // 2. Read full keymap
  setSyncProgress('Reading keymap');
  const keymapBytes = layers * def.matrix.rows * def.matrix.cols * 2;
  const keymap = new Array(layers * def.matrix.rows * def.matrix.cols).fill(0);

  for (let offset = 0; offset < keymapBytes; offset += 28) {
    const expectedSize = Math.min(28, keymapBytes - offset);
    const expectedOffset = [(offset >>> 8) & 0xff, offset & 0xff];
    const resp = await sendViaCommand(Protocol.getKeymapBuffer(offset, expectedSize));

    // Devices respond with full 32-byte frames; the payload length is the
    // declared size in byte 3, not the frame length.
    const declaredSize = resp[3] ?? 0;
    if (
      resp.length - 4 < declaredSize ||
      declaredSize !== expectedSize ||
      resp[1] !== expectedOffset[0] ||
      resp[2] !== expectedOffset[1]
    ) {
      throw new Error('Invalid chunk response');
    }

    const chunk = decodeBufferChunk(resp);

    if (chunk.offset < 0 || chunk.offset >= keymapBytes) {
      throw new Error(`Keymap offset out of bounds: ${chunk.offset}`);
    }
    if (chunk.offset + chunk.data.length > keymapBytes) {
      throw new Error(`Keymap bounds exceeded: ${chunk.offset} + ${chunk.data.length} > ${keymapBytes}`);
    }

    for (let i = 0; i < chunk.data.length - 1; i += 2) {
      const code = ((chunk.data[i]! << 8) | chunk.data[i + 1]!) >>> 0;
      const keyIdx = (chunk.offset + i) / 2;
      keymap[keyIdx] = code;
    }
  }

  const snapshot: DeviceSnapshot = { layers, keymap };

  // 3. Read layout options (non-fatal: older firmware may not support it)
  setSyncProgress('Reading layout options');
  try {
    const loResp = await sendViaCommand(Protocol.getLayoutOptions());
    snapshot.layoutOptions = decodeLayoutOptions(loResp);
  } catch {
    // unsupported, do not fabricate
  }

  // 4. Read encoder maps if encoders exist
  const encoderCount = def.encoders ?? 0;
  if (encoderCount > 0) {
    setSyncProgress('Reading encoders');
    const encoders = new Array(layers * encoderCount * 2).fill(0);
    try {
      // test if encoder 0 is supported
      await sendViaCommand(Protocol.getEncoderKeycode(0, 0, 0));
      for (let l = 0; l < layers; l++) {
        for (let e = 0; e < encoderCount; e++) {
          for (let cw = 0; cw < 2; cw++) {
            const resp = await sendViaCommand(Protocol.getEncoderKeycode(l, e, cw));
            const code = ((resp[4] ?? 0) << 8) | (resp[5] ?? 0);
            encoders[l * encoderCount * 2 + e * 2 + cw] = code;
          }
        }
      }
      snapshot.encoders = encoders;
    } catch {
      // unsupported, do not fabricate
    }
  }

  // 5. Read lighting if supported
  if (def.lighting !== 'none') {
    setSyncProgress('Reading lighting');
    try {
      // test if getting backlight value is supported
      const resp = await sendViaCommand(Protocol.getCustomValue(0x08, 0x01)); // VIA_ID_BACKLIGHT_BRIGHTNESS is 0x08, 0x01
      // ponytail: assuming successful read means lighting is supported and returns standard values
      snapshot.lighting = {
        brightness: resp[4] ?? 0,
        effect: (await sendViaCommand(Protocol.getCustomValue(0x08, 0x02)))[4] ?? 0,
        speed: (await sendViaCommand(Protocol.getCustomValue(0x08, 0x03)))[4] ?? 0,
        hue: (await sendViaCommand(Protocol.getCustomValue(0x08, 0x04)))[4] ?? 0,
        saturation: (await sendViaCommand(Protocol.getCustomValue(0x08, 0x05)))[4] ?? 0
      };
    } catch {
      // unsupported, do not fabricate
    }
  }

  // 6. Read macro metadata
  setSyncProgress('Reading macros');
  try {
    const macroCountResp = await sendViaCommand(Protocol.getMacroCount());
    const count = decodeMacroCount(macroCountResp);

    if (count > 0) {
      const macroSizeResp = await sendViaCommand(Protocol.getMacroBufferSize());
      const bytes = decodeMacroBufferSize(macroSizeResp);

      const buffer = [];
      for (let offset = 0; offset < bytes; offset += 28) {
        const expectedSize = Math.min(28, bytes - offset);
        const resp = await sendViaCommand(Protocol.getMacroBuffer(offset, expectedSize));
        const chunk = decodeBufferChunk(resp);
        buffer.push(...chunk.data);
      }

      snapshot.macros = { count, bytes, buffer };
    }
  } catch {
    // Macros may not be configured — non-fatal
  }

  setSyncPhase('ready');
  setSyncProgress('');

  return snapshot;
}

export function parseDeviceName(info: RawPacket): string {
  const nameBytes = info.slice(4).filter(b => b !== 0);
  if (nameBytes.length === 0) return '';
  return String.fromCharCode(...nameBytes);
}
