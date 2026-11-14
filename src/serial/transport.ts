import {
  encodeOrthoPadFrame,
  OrthoPadFlags,
  OrthoPadFrameDecoder,
  OrthoPadProtocolError,
  responseData,
  type OrthoPadFrame,
} from '../core/orthopad-protocol';

export type SerialTransportState = 'disconnected' | 'connecting' | 'connected' | 'error';

export type SerialPortLike = {
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  open(options: { baudRate: number; dataBits?: number; stopBits?: number; parity?: string; flowControl?: string }): Promise<void>;
  close(): Promise<void>;
};

export type SerialApiLike = {
  requestPort(): Promise<SerialPortLike>;
};

type PendingRequest = {
  resolve: (frame: OrthoPadFrame) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
};

function serialApi(): SerialApiLike {
  const api = (navigator as Navigator & { serial?: SerialApiLike }).serial;
  if (!api) throw new Error('Web Serial is not supported. Use Chrome or Edge.');
  return api;
}

export class OrthoPadSerialTransport {
  #state: SerialTransportState = 'disconnected';
  #port: SerialPortLike | null = null;
  #reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  #writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  #readTask: Promise<void> | null = null;
  #decoder = new OrthoPadFrameDecoder();
  #sequence = 0;
  #pending = new Map<number, PendingRequest>();

  onStateChange: ((state: SerialTransportState) => void) | null = null;
  onFrame: ((frame: OrthoPadFrame) => void) | null = null;

  get state(): SerialTransportState {
    return this.#state;
  }

  async connect(): Promise<void> {
    if (this.#state === 'connected') return;
    this.setState('connecting');
    try {
      const port = await serialApi().requestPort();
      this.#port = port;
      await port.open({ baudRate: 115200, dataBits: 8, stopBits: 1, parity: 'none', flowControl: 'none' });
      if (!port.readable || !port.writable) throw new Error('Serial port does not expose readable/writable streams');
      this.#reader = port.readable.getReader();
      this.#writer = port.writable.getWriter();
      this.#decoder.reset();
      this.setState('connected');
      this.#readTask = this.readLoop();
    } catch (error) {
      await this.cleanup();
      this.setState('error');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.cleanup();
    this.setState('disconnected');
  }

  async request(command: number, payload = new Uint8Array(0), timeoutMs = 500): Promise<Uint8Array> {
    const frame = await this.send(command, payload, timeoutMs);
    return responseData(frame);
  }

  async send(command: number, payload = new Uint8Array(0), timeoutMs = 500): Promise<OrthoPadFrame> {
    if (this.#state !== 'connected' || !this.#writer) throw new Error('Not connected');
    const sequence = this.nextSequence();
    const packet = encodeOrthoPadFrame({
      version: 1,
      flags: 0,
      sequence,
      command,
      payload,
    });
    const response = new Promise<OrthoPadFrame>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.#pending.delete(sequence);
        reject(new Error(`Protocol request timed out: 0x${command.toString(16).padStart(2, '0')}`));
      }, timeoutMs);
      this.#pending.set(sequence, { resolve, reject, timeoutId });
    });
    try {
      await this.#writer.write(packet);
    } catch (error) {
      const pending = this.#pending.get(sequence);
      if (pending) {
        clearTimeout(pending.timeoutId);
        this.#pending.delete(sequence);
        pending.reject(error instanceof Error ? error : new Error('Serial write failed'));
      }
    }
    return response;
  }

  private async readLoop(): Promise<void> {
    if (!this.#reader) return;
    try {
      while (this.#state === 'connected') {
        const result = await this.#reader.read();
        if (result.done) break;
        for (const frame of this.#decoder.push(result.value)) this.handleFrame(frame);
      }
      if (this.#state === 'connected') await this.disconnect();
    } catch (error) {
      this.rejectPending(error instanceof Error ? error : new Error('Serial read failed'));
      if (this.#state !== 'disconnected') {
        this.setState('error');
        await this.cleanup();
      }
    }
  }

  private handleFrame(frame: OrthoPadFrame): void {
    this.onFrame?.(frame);
    if ((frame.flags & OrthoPadFlags.Response) === 0) return;
    const pending = this.#pending.get(frame.sequence);
    if (!pending) return;
    clearTimeout(pending.timeoutId);
    this.#pending.delete(frame.sequence);
    pending.resolve(frame);
  }

  private async cleanup(): Promise<void> {
    this.rejectPending(new Error('Serial transport disconnected'));
    const reader = this.#reader;
    const writer = this.#writer;
    const port = this.#port;
    this.#reader = null;
    this.#writer = null;
    this.#port = null;
    this.#readTask = null;
    try { await reader?.cancel(); } catch { /* already closed */ }
    try { reader?.releaseLock(); } catch { /* lock already released */ }
    try { writer?.releaseLock(); } catch { /* lock already released */ }
    try { await port?.close(); } catch { /* port already closed */ }
  }

  private rejectPending(error: Error): void {
    for (const [sequence, pending] of this.#pending) {
      clearTimeout(pending.timeoutId);
      pending.reject(error);
      this.#pending.delete(sequence);
    }
  }

  private nextSequence(): number {
    this.#sequence = (this.#sequence + 1) & 0xffff;
    return this.#sequence;
  }

  private setState(state: SerialTransportState): void {
    this.#state = state;
    this.onStateChange?.(state);
  }
}

export function isOrthoPadProtocolError(error: unknown): error is OrthoPadProtocolError {
  return error instanceof OrthoPadProtocolError;
}
