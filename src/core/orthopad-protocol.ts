export const ORTHOPAD_SYNC_0 = 0x4f;
export const ORTHOPAD_SYNC_1 = 0x50;
export const ORTHOPAD_PROTOCOL_VERSION = 1;
export const ORTHOPAD_MAX_PAYLOAD = 128;
export const ORTHOPAD_HEADER_SIZE = 9;
export const ORTHOPAD_TRAILER_SIZE = 2;

export const enum OrthoPadFlags {
  Response = 0x01,
  Error = 0x02,
  Notification = 0x04,
}

export const enum OrthoPadCommand {
  Hello = 0x01,
  GetInfo = 0x02,
  GetKeymap = 0x10,
  SetKeymap = 0x11,
  GetEncoder = 0x12,
  SetEncoder = 0x13,
  GetCadSettings = 0x20,
  SetCadSettings = 0x21,
  Commit = 0x30,
  Discard = 0x31,
  ResetDefaults = 0x32,
  Verify = 0x33,
  GetJoystickState = 0x40,
  SetTestMode = 0x41,
  Reboot = 0x7f,
}

export const enum OrthoPadStatus {
  Ok = 0x00,
  UnknownCommand = 0x01,
  InvalidLength = 0x02,
  InvalidArgument = 0x03,
  CrcError = 0x04,
  UnsupportedVersion = 0x05,
  Busy = 0x06,
  StorageError = 0x07,
  NotFound = 0x08,
  InternalError = 0x09,
}

export type OrthoPadFrame = {
  version: number;
  flags: number;
  sequence: number;
  command: number;
  payload: Uint8Array;
};

export class OrthoPadProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrthoPadProtocolError';
  }
}

export function crc16Ccitt(data: Uint8Array): number {
  let crc = 0xffff;
  for (const byte of data) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc;
}

function readU16LE(view: DataView, offset: number): number {
  return view.getUint16(offset, true);
}

export function encodeOrthoPadFrame(frame: OrthoPadFrame): Uint8Array {
  if (!Number.isInteger(frame.version) || frame.version < 0 || frame.version > 0xff) {
    throw new OrthoPadProtocolError('Invalid protocol version');
  }
  if (!Number.isInteger(frame.flags) || frame.flags < 0 || frame.flags > 0xff) {
    throw new OrthoPadProtocolError('Invalid frame flags');
  }
  if (!Number.isInteger(frame.sequence) || frame.sequence < 0 || frame.sequence > 0xffff) {
    throw new OrthoPadProtocolError('Invalid sequence');
  }
  if (!Number.isInteger(frame.command) || frame.command < 0 || frame.command > 0xff) {
    throw new OrthoPadProtocolError('Invalid command');
  }
  if (frame.payload.byteLength > ORTHOPAD_MAX_PAYLOAD) {
    throw new OrthoPadProtocolError('Payload exceeds maximum length');
  }

  const body = new Uint8Array(7 + frame.payload.byteLength);
  const view = new DataView(body.buffer);
  body[0] = frame.version;
  body[1] = frame.flags;
  view.setUint16(2, frame.sequence, true);
  body[4] = frame.command;
  view.setUint16(5, frame.payload.byteLength, true);
  body.set(frame.payload, 7);

  const output = new Uint8Array(2 + body.byteLength + ORTHOPAD_TRAILER_SIZE);
  output[0] = ORTHOPAD_SYNC_0;
  output[1] = ORTHOPAD_SYNC_1;
  output.set(body, 2);
  const crc = crc16Ccitt(body);
  new DataView(output.buffer).setUint16(output.byteLength - 2, crc, true);
  return output;
}

export function decodeOrthoPadFrame(frame: Uint8Array): OrthoPadFrame {
  if (frame.byteLength < ORTHOPAD_HEADER_SIZE + ORTHOPAD_TRAILER_SIZE) {
    throw new OrthoPadProtocolError('Frame is too short');
  }
  if (frame[0] !== ORTHOPAD_SYNC_0 || frame[1] !== ORTHOPAD_SYNC_1) {
    throw new OrthoPadProtocolError('Invalid frame sync');
  }

  const body = frame.subarray(2, frame.byteLength - ORTHOPAD_TRAILER_SIZE);
  const payloadLength = readU16LE(new DataView(body.buffer, body.byteOffset, body.byteLength), 5);
  if (payloadLength > ORTHOPAD_MAX_PAYLOAD || body.byteLength !== 7 + payloadLength) {
    throw new OrthoPadProtocolError('Invalid frame length');
  }

  const expectedCrc = new DataView(frame.buffer, frame.byteOffset, frame.byteLength).getUint16(frame.byteLength - 2, true);
  const actualCrc = crc16Ccitt(body);
  if (expectedCrc !== actualCrc) {
    throw new OrthoPadProtocolError('Invalid frame CRC');
  }

  const bodyView = new DataView(body.buffer, body.byteOffset, body.byteLength);
  return {
    version: body[0] ?? 0,
    flags: body[1] ?? 0,
    sequence: bodyView.getUint16(2, true),
    command: body[4] ?? 0,
    payload: body.slice(7),
  };
}

export class OrthoPadFrameDecoder {
  #buffer = new Uint8Array(0);

  push(chunk: Uint8Array): OrthoPadFrame[] {
    if (chunk.byteLength === 0) return [];
    const merged = new Uint8Array(this.#buffer.byteLength + chunk.byteLength);
    merged.set(this.#buffer);
    merged.set(chunk, this.#buffer.byteLength);
    this.#buffer = merged;

    const frames: OrthoPadFrame[] = [];
    while (true) {
      const syncIndex = this.findSync();
      if (syncIndex < 0) {
        this.#buffer = this.#buffer.slice(Math.max(0, this.#buffer.byteLength - 1));
        break;
      }
      if (syncIndex > 0) this.#buffer = this.#buffer.slice(syncIndex);
      if (this.#buffer.byteLength < ORTHOPAD_HEADER_SIZE + ORTHOPAD_TRAILER_SIZE) break;

      const bodyView = new DataView(this.#buffer.buffer, this.#buffer.byteOffset, this.#buffer.byteLength);
      const payloadLength = bodyView.getUint16(2 + 5, true);
      if (payloadLength > ORTHOPAD_MAX_PAYLOAD) {
        this.#buffer = this.#buffer.slice(2);
        continue;
      }
      const frameLength = 2 + 7 + payloadLength + ORTHOPAD_TRAILER_SIZE;
      if (this.#buffer.byteLength < frameLength) break;

      const candidate = this.#buffer.slice(0, frameLength);
      this.#buffer = this.#buffer.slice(frameLength);
      try {
        frames.push(decodeOrthoPadFrame(candidate));
      } catch {
        // Drop malformed candidate and continue resynchronizing at the next frame.
      }
    }
    return frames;
  }

  reset(): void {
    this.#buffer = new Uint8Array(0);
  }

  private findSync(): number {
    for (let i = 0; i < this.#buffer.byteLength - 1; i++) {
      if (this.#buffer[i] === ORTHOPAD_SYNC_0 && this.#buffer[i + 1] === ORTHOPAD_SYNC_1) return i;
    }
    return -1;
  }
}

export function responseData(frame: OrthoPadFrame): Uint8Array {
  if ((frame.flags & OrthoPadFlags.Response) === 0) {
    throw new OrthoPadProtocolError('Frame is not a response');
  }
  if (frame.payload.byteLength < 1) throw new OrthoPadProtocolError('Response has no status');
  const status = frame.payload[0] ?? OrthoPadStatus.InternalError;
  if ((frame.flags & OrthoPadFlags.Error) !== 0 || status !== OrthoPadStatus.Ok) {
    throw new OrthoPadProtocolError(`Device returned status 0x${status.toString(16).padStart(2, '0')}`);
  }
  return frame.payload.slice(1);
}
