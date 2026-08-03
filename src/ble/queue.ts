import { type RawPacket } from '../core/protocol';
import { type CommandRequest, isErrorResponse } from '../core/commands';

export type QueueConfig = { retries: number; maxDepth: number };

export class PacketQueue {
  private pending: CommandRequest[] = [];
  private current: CommandRequest | null = null;
  private written = false;
  private retriesLeft = 0;

  constructor(private config: QueueConfig) {}

  enqueue(request: CommandRequest): void {
    if (this.pending.length + (this.current ? 1 : 0) >= this.config.maxDepth) {
      throw new Error('Queue full');
    }
    this.pending.push(request);
  }

  takeForSend(): RawPacket | null {
    if (this.current && !this.written) return this.current.packet;
    if (this.current) return null;

    const next = this.pending.shift();
    if (!next) return null;
    this.current = next;
    this.written = false;
    this.retriesLeft = this.config.retries;
    return this.current.packet;
  }

  markSent(): void {
    this.written = true;
  }

  handleError(error: Error): boolean {
    if (!this.current) return false;
    this.current.reject(error);
    this.current = null;
    this.written = false;
    return true;
  }

  handleResponse(response: RawPacket): boolean {
    if (!this.current) return false;

    if (isErrorResponse(response)) {
      this.current.reject(new Error(`VIA error: command 0x${this.current.packet[0]?.toString(16)} rejected`));
    } else {
      if (!this.current.matches(response)) return false;
      this.current.resolve(response);
    }
    
    this.current = null;
    this.written = false;
    return true;
  }

  retry(): RawPacket | null {
    if (!this.current) return null;
    this.retriesLeft--;
    if (this.retriesLeft < 0) {
      const req = this.current;
      this.current = null;
      this.written = false;
      req.reject(new Error('Retry exhausted'));
      return null;
    }
    this.written = false;
    return this.current.packet;
  }

  clear(): void {
    const current = this.current;
    if (current) current.reject(new Error('Disconnected'));
    for (const req of this.pending) req.reject(new Error('Disconnected'));
    this.pending = [];
    this.current = null;
    this.written = false;
    this.retriesLeft = 0;
  }

  get pendingCount(): number { return this.pending.length; }
  hasInFlight(): boolean { return this.current !== null; }
}
