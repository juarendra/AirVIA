import { describe, it, expect } from 'vitest';
import { PacketQueue, type QueueConfig } from './queue';
import { type RawPacket } from '../core/protocol';
import { type CommandRequest } from '../core/commands';

function cmd(c: number): CommandRequest {
  const pkt = new Array(32).fill(0);
  pkt[0] = c;
  return {
    packet: pkt,
    matches: (r: RawPacket) => r.length > 0 && r[0] === c,
    // @ts-expect-error test helper: generic decode relaxed for test convenience
    decode: (r: RawPacket): unknown => r,
    resolve: () => {},
    reject: () => {},
  };
}

function makeConfig(overrides: Partial<QueueConfig> = {}): QueueConfig {
  return { retries: 3, maxDepth: 10, ...overrides };
}

describe('PacketQueue', () => {
  it('dequeues first enqueued packet', () => {
    const q = new PacketQueue(makeConfig());
    q.enqueue(cmd(1));
    q.enqueue(cmd(2));
    expect(q.takeForSend()).toEqual(cmd(1).packet);
  });

  it('returns null when empty', () => {
    const q = new PacketQueue(makeConfig());
    expect(q.takeForSend()).toBeNull();
  });

  it('resolve advances to next', () => {
    const q = new PacketQueue(makeConfig());
    q.enqueue(cmd(1));
    q.enqueue(cmd(2));
    expect(q.takeForSend()).toEqual(cmd(1).packet);
    q.handleResponse(new Array(32).fill(0).map((_, i) => (i === 0 ? 1 : 0)));
    expect(q.takeForSend()).toEqual(cmd(2).packet);
  });

  it('retry on timeout', () => {
    const q = new PacketQueue(makeConfig({ retries: 2 }));
    q.enqueue(cmd(1));
    q.enqueue(cmd(2));

    q.takeForSend();
    q.markSent();

    expect(q.retry()).not.toBeNull();
    expect(q.retry()).not.toBeNull();
    expect(q.retry()).toBeNull();

    expect(q.takeForSend()).toEqual(cmd(2).packet);
  });

  it('exhaustion exposes next request', () => {
    let rejected = '';
    const r1 = cmd(1);
    r1.reject = (e: Error) => { rejected = e.message; };
    const r2 = cmd(2);

    const q = new PacketQueue(makeConfig({ retries: 0 }));
    q.enqueue(r1);
    q.enqueue(r2);

    q.takeForSend(); // pops r1
    q.markSent();

    expect(q.retry()).toBeNull(); // r1 exhausted
    expect(rejected).toContain('exhausted');
    
    // r2 should now be available for send
    expect(q.takeForSend()).toEqual(cmd(2).packet);
  });

  it('stops after max retries', () => {
    let rejected = '';
    const r = cmd(1);
    r.reject = (e: Error) => { rejected = e.message; };

    const q = new PacketQueue(makeConfig({ retries: 0 }));
    q.enqueue(r);

    q.takeForSend();
    q.markSent();

    expect(q.retry()).toBeNull();
    expect(rejected).toContain('exhausted');
    expect(q.takeForSend()).toBeNull();
  });

  it('rejects 0xFF error responses', () => {
    let rejected = '';
    const r = cmd(1);
    r.reject = (e: Error) => { rejected = e.message; };

    const q = new PacketQueue(makeConfig());
    q.enqueue(r);
    q.takeForSend();
    
    // Simulate 0xFF error response packet
    const errResp = new Array(32).fill(0);
    errResp[0] = 0xFF; // Error indicator
    errResp[1] = 1;    // Original command that failed
    
    expect(q.handleResponse(errResp)).toBe(true);
    expect(rejected).toContain('VIA error: command 0x1 rejected');
  });

  it('rejects enqueue when full', () => {
    const q = new PacketQueue(makeConfig({ maxDepth: 2 }));
    q.enqueue(cmd(1));
    q.enqueue(cmd(2));
    expect(() => q.enqueue(cmd(3))).toThrow('Queue full');
  });

  it('clear empties queue', () => {
    const q = new PacketQueue(makeConfig());
    q.enqueue(cmd(1));
    q.enqueue(cmd(2));
    q.takeForSend();
    q.clear();
    expect(q.pendingCount).toBe(0);
    expect(q.hasInFlight()).toBe(false);
  });
});
