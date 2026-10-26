import { getTransport, sendViaCommand } from '../ble/dispatch';
import { Protocol, type RawPacket } from '../core/protocol';
import { decodeMacroSlots } from '../core/macros';
import { getConnectionState, getSyncPhase, getMacroCount, getMacroBytes, setMacroBuffer } from '../store/app.svelte';

export async function saveMacroBuffer(buffer: number[], signal: AbortSignal): Promise<void> {
  const session = getTransport();
  const count = getMacroCount();
  const bytes = getMacroBytes();
  if (!session || count === null || !bytes || buffer.length !== bytes || buffer[bytes - 1] !== 0) {
    throw new Error('Macro configuration is unavailable');
  }
  decodeMacroSlots(buffer, count);
  const check = () => {
    signal.throwIfAborted();
    if (getTransport() !== session || getConnectionState() !== 'connected' ||
        getSyncPhase() !== 'ready' || getMacroCount() !== count || getMacroBytes() !== bytes) {
      throw new Error('Macro session changed; reconnect before saving');
    }
  };
  const send = async (packet: RawPacket): Promise<RawPacket> => {
    check();
    const response = await sendViaCommand(packet);
    check();
    if (response[0] !== packet[0] || (packet[0] !== 0x09 &&
        (response[1] !== packet[1] || response[2] !== packet[2] || response[3] !== packet[3]))) {
      throw new Error('Invalid macro response');
    }
    return response;
  };
  // QMK's last-byte guard prevents playback of a partially uploaded program.
  await send(Protocol.setMacroBuffer(bytes - 1, [255]));
  for (let offset = 0; offset < bytes - 1; offset += 28) {
    await send(Protocol.setMacroBuffer(offset, buffer.slice(offset, Math.min(offset + 28, bytes - 1))));
  }
  await send(Protocol.setMacroBuffer(bytes - 1, [0]));
  await send(Protocol.saveCustomValue(0x02));
  const verified: number[] = [];
  for (let offset = 0; offset < bytes; offset += 28) {
    const size = Math.min(28, bytes - offset);
    const response = await send(Protocol.getMacroBuffer(offset, size));
    if (response.length < 4 + size) throw new Error('Truncated macro readback');
    verified.push(...response.slice(4, 4 + size));
  }
  if (verified.some((byte, index) => byte !== buffer[index])) {
    throw new Error('Macro readback differs; retry the complete upload');
  }
  check();
  setMacroBuffer(verified);
}
