import type { BLETransport } from './transport';
import type { RawPacket } from '../core/protocol';

let transport: BLETransport | null = null;

export function setTransport(t: BLETransport | null) {
  transport = t;
}

export function sendPacket(pkt: RawPacket) {
  transport?.send(pkt);
}
