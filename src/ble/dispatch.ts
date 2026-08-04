import type { BLETransport } from './transport';
import type { RawPacket } from '../core/protocol';

let transport: BLETransport | null = null;

export function setTransport(t: BLETransport | null) {
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
    matches: (response: RawPacket) => {
      if (response.length === 0) return false;
      if (response[0] === 0xff) return false; // Reject error frames
      return response[0] === packet[0] || response[0] === 0;
    },
    decode: <T>(res: RawPacket) => res as unknown as T,
    resolve: () => {},
    reject: () => {},
  });
}
