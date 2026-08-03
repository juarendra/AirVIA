import type { RawPacket } from '../core/protocol';
import { Protocol } from '../core/protocol';
import { decodeLayerCount, decodeBufferChunk, decodeMacroCount, decodeMacroBufferSize } from '../core/commands';
import { sendViaCommand } from '../ble/dispatch';
import {
  setSyncPhase, setSyncProgress, setLayerCount, setKeymap, setKeymapAtIndex,
  setEncoderCount, setEncoderMap, setMacroCount, setMacroBytes,
  getDefinition,
} from '../store/app.svelte';

export type DeviceSnapshot = {
  layers: number;
  keymap: number[];
  encoders?: number[];
  lighting?: { brightness: number; effect: number; speed: number; hue: number; saturation: number };
  layoutOptions?: number;
  macros?: { count: number; bytes: number };
};

export async function synchronizeDevice(): Promise<DeviceSnapshot> {
  const def = getDefinition();
  if (!def) throw new Error('No definition loaded');

  // 1. Get layer count
  const layerResp = await sendViaCommand(Protocol.getLayerCount());
  const layers = decodeLayerCount(layerResp);
  if (!layers || layers < 1) throw new Error('Invalid layer count');

  // 2. Read full keymap
  const keymapBytes = layers * def.matrix.rows * def.matrix.cols * 2;
  const keymap = new Array(layers * def.matrix.rows * def.matrix.cols).fill(0);

  for (let offset = 0; offset < keymapBytes; offset += 28) {
    const resp = await sendViaCommand(Protocol.getKeymapBuffer(offset, Math.min(28, keymapBytes - offset)));
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

  // 3. Read encoder maps if encoders exist
  const encoderCount = def.encoders ?? 0;
  if (encoderCount > 0) {
    // ponytail: read encoder maps via individual 0x14 commands later — bulk read needs firmware support
    snapshot.encoders = new Array(layers * encoderCount * 2).fill(0);
  }

  // 4. Read macro metadata
  try {
    const macroCountResp = await sendViaCommand(Protocol.getMacroCount());
    const count = decodeMacroCount(macroCountResp);
    
    if (count > 0) {
      const macroSizeResp = await sendViaCommand(Protocol.getMacroBufferSize());
      snapshot.macros = { count, bytes: decodeMacroBufferSize(macroSizeResp) };
    }
  } catch {
    // Macros may not be configured — non-fatal
  }

  return snapshot;
}

export function parseDeviceName(info: RawPacket): string {
  const nameBytes = info.slice(4).filter(b => b !== 0);
  if (nameBytes.length === 0) return '';
  return String.fromCharCode(...nameBytes);
}
