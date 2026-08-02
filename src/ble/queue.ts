import { type RawPacket } from '../core/protocol';

export type QueueConfig = { retries: number; maxDepth: number };

export class PacketQueue {
  private pending: RawPacket[] = [];
  private current: RawPacket | null = null;
  private written = false;
  private retriesLeft = 0;

  constructor(private config: QueueConfig) {}

  enqueue(packet: RawPacket): void {
    if (this.pending.length >= this.config.maxDepth) {
      throw new Error('Queue full');
    }
    this.pending.push([...packet]);
  }

  /** Returns head to send, or null. Only returns same packet on retry (after timeout). */
  takeForSend(): RawPacket | null {
    if (this.current && !this.written) return this.current;
    if (this.current) return null;

    const next = this.pending.shift();
    if (!next) return null;
    this.current = next;
    this.written = false;
    this.retriesLeft = this.config.retries;
    return this.current;
  }

  /** Mark current as sent (call after successful write). */
  markSent(): void {
    this.written = true;
  }

  /** Clear current after successful response. */
  resolve(): void {
    this.current = null;
    this.written = false;
  }

  /** Retry: mark unsent again so takeForSend returns it. Returns null if exhausted. */
  retry(): RawPacket | null {
    if (!this.current) return null;
    this.retriesLeft--;
    if (this.retriesLeft <= 0) {
      this.current = null;
      this.written = false;
      return null;
    }
    this.written = false;
    return this.current;
  }

  clear(): void {
    this.pending = [];
    this.current = null;
    this.written = false;
    this.retriesLeft = 0;
  }

  get pendingCount(): number { return this.pending.length; }
  hasInFlight(): boolean { return this.current !== null; }
}
