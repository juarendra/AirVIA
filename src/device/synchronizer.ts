import type { RawPacket } from '../core/protocol';
import { Protocol } from '../core/protocol';
import { decodeLayerCount, decodeBufferChunk, decodeMacroCount, decodeMacroBufferSize } from '../core/commands';
import { sendViaCommand } from '../ble/dispatch';
import {
  setSyncPhase, setSyncProgress, setLayerCount, setKeymap, setKeymapAtIndex,
  setEncoderCount, setEncoderMap, setMacroCount, setMacroBytes,
  getDefinition,
} from '../store/app.svelte';

export async function synchronizeDevice(): Promise<void> {
  setSyncPhase('syncing');

  const def = getDefinition();
  if (!def) throw new Error('No definition loaded');

  // 1. Get layer count
  setSyncProgress('Reading layer count...');
  const layerResp = await sendViaCommand(Protocol.getLayerCount());
  const layers = decodeLayerCount(layerResp);
  if (!layers || layers < 1) throw new Error('Invalid layer count');
  setLayerCount(layers);

  // 2. Read full keymap
  const keymapBytes = layers * def.matrix.rows * def.matrix.cols * 2;
  setSyncProgress(`Reading keymap (${keymapBytes} bytes)...`);
  setKeymap(new Array(layers * def.matrix.rows * def.matrix.cols).fill(0));

  for (let offset = 0; offset < keymapBytes; offset += 28) {
    const resp = await sendViaCommand(Protocol.getKeymapBuffer(offset, Math.min(28, keymapBytes - offset)));
    const chunk = decodeBufferChunk(resp);
    for (let i = 0; i < chunk.data.length - 1; i += 2) {
      const code = ((chunk.data[i]! << 8) | chunk.data[i + 1]!) >>> 0;
      const keyIdx = (chunk.offset + i) / 2;
      setKeymapAtIndex(keyIdx, code);
    }
  }

  // 3. Read encoder maps if encoders exist
  const encoderCount = def.encoders ?? 0;
  if (encoderCount > 0) {
    setSyncProgress('Reading encoder maps...');
    setEncoderCount(encoderCount);
    setEncoderMap(new Array(layers * encoderCount * 2).fill(0));
    // ponytail: read encoder maps via individual 0x14 commands later — bulk read needs firmware support
  }

  // 4. Read macro metadata
  setSyncProgress('Reading macros...');
  try {
    const macroCountResp = await sendViaCommand(Protocol.getMacroCount());
    const count = decodeMacroCount(macroCountResp);
    setMacroCount(count);

    if (count > 0) {
      const macroSizeResp = await sendViaCommand(Protocol.getMacroBufferSize());
      setMacroBytes(decodeMacroBufferSize(macroSizeResp));
    }
  } catch {
    // Macros may not be configured — non-fatal
    setMacroCount(0);
    setMacroBytes(0);
  }

  // ponytail: VID/PID matching deferred until firmware exposes device identity in FF62
  setSyncPhase('ready');
}

export function parseDeviceName(info: RawPacket): string {
  const nameBytes = info.slice(4).filter(b => b !== 0);
  if (nameBytes.length === 0) return '';
  return String.fromCharCode(...nameBytes);
}
