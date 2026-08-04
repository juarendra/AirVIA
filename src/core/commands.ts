import { type RawPacket } from './protocol';

export type CommandRequest = {
  packet: RawPacket;
  matches: (response: RawPacket) => boolean;
  decode: <T>(response: RawPacket) => T;
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timeoutMs?: number;
};

export function matchByCommand(request: RawPacket, response: RawPacket): boolean {
  return response.length > 0 && response[0] === request[0];
}

export function isErrorResponse(response: RawPacket): boolean {
  return response.length > 0 && response[0] === 0xFF;
}

export function decodeLayerCount(response: RawPacket): number {
  return response[1] ?? 0;
}

export function decodeBufferChunk(response: RawPacket): { offset: number; data: number[] } {
  const offset = ((response[1] ?? 0) << 8) | (response[2] ?? 0);
  const size = response[3] ?? 0;
  const data: number[] = [];
  for (let i = 0; i < size && i < 28; i++) {
    data.push(response[4 + i] ?? 0);
  }
  return { offset, data };
}

export function decodeKeycode(response: RawPacket): number {
  return ((response[4] ?? 0) << 8) | (response[5] ?? 0);
}

export function decodeEncoderKeycode(response: RawPacket): number {
  return ((response[4] ?? 0) << 8) | (response[5] ?? 0);
}

export function decodeMacroCount(response: RawPacket): number {
  return response[1] ?? 0;
}

export function decodeMacroBufferSize(response: RawPacket): number {
  return ((response[1] ?? 0) << 8) | (response[2] ?? 0);
}

export function decodeLayoutOptions(response: RawPacket): number {
  return ((response[2] ?? 0) << 24) | ((response[3] ?? 0) << 16) |
         ((response[4] ?? 0) << 8) | (response[5] ?? 0);
}
