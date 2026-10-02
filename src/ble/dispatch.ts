import type { Transport } from './transport';
import type { RawPacket } from '../core/protocol';

let transport: Transport | null = null;

export function setTransport(t: Transport | null) {
  transport = t;
}

export async function sendPacket(pkt: RawPacket): Promise<void> {
  if (!transport) throw new Error('Not connected');
  // Fire and forget send is now handled through queue with dummy callbacks to drop wait
  transport.sendCommand({
    packet: pkt,
    matches: () => true, // Auto-match if responses arrive
    decode: <T>(res: RawPacket) => res as unknown as T,
    resolve: () => {},
    reject: () => {},
  }).catch(() => { /* fire and forget */ });
}

export async function sendViaCommand(packet: RawPacket, timeoutMs = 1000): Promise<RawPacket> {
  if (!transport) throw new Error('Not connected');

  return transport.sendCommand({
    packet,
    timeoutMs,
    // 0xFF error frames never reach the matcher: the queue rejects the
    // in-flight request directly. Only same-command frames resolve it.
    matches: (response: RawPacket) => response.length > 0 && response[0] === packet[0],
    decode: <T>(res: RawPacket) => res as unknown as T,
    resolve: () => {},
    reject: () => {},
  });
}
