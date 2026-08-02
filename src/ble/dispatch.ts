import type { BLETransport } from './transport';
import type { RawPacket } from '../core/protocol';

let transport: BLETransport | null = null;

export function setTransport(t: BLETransport | null) {
  transport = t;
}

export async function sendPacket(pkt: RawPacket): Promise<void> {
  if (!transport) throw new Error('Not connected');
  await transport.send(pkt);
}

export async function sendViaCommand(packet: RawPacket, timeoutMs = 5000): Promise<RawPacket> {
  if (!transport) throw new Error('Not connected');

  const cmd = packet[0]!;
  const prevHandler = transport.onResponse;

  const result = new Promise<RawPacket>((resolve, reject) => {
    const timer = setTimeout(() => {
      transport!.onResponse = prevHandler;
      reject(new Error(`Command 0x${cmd.toString(16).padStart(2, '0')} timed out`));
    }, timeoutMs);

    transport!.onResponse = (pkt) => {
      if (pkt.length > 0 && (pkt[0] === cmd || pkt[0] === 0)) {
        clearTimeout(timer);
        transport!.onResponse = prevHandler;
        resolve(pkt);
      } else {
        prevHandler?.(pkt);
      }
    };

    transport!.writePacket(packet);
  });

  return result;
}
