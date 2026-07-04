import type { SessionState } from "@funtog/contracts";

/**
 * Broadcast is a SEPARATE concern from the decision core. The actor publishes one snapshot; the
 * broadcaster fans out. In production this is the stateless pub/sub tier (so fan-out scales
 * independently of the core); here it's in-memory. Late joiners get the last snapshot on subscribe.
 */
export interface Broadcaster {
  publish(sessionId: string, state: SessionState): void;
  subscribe(sessionId: string, fn: (s: SessionState) => void): () => void;
  snapshot(sessionId: string): SessionState | undefined;
}

export class InMemoryBroadcaster implements Broadcaster {
  private subs = new Map<string, Set<(s: SessionState) => void>>();
  private last = new Map<string, SessionState>();

  publish(sessionId: string, state: SessionState): void {
    this.last.set(sessionId, state);
    const set = this.subs.get(sessionId);
    if (set) for (const fn of set) fn(state);
  }
  subscribe(sessionId: string, fn: (s: SessionState) => void): () => void {
    let set = this.subs.get(sessionId);
    if (!set) { set = new Set(); this.subs.set(sessionId, set); }
    set.add(fn);
    const snap = this.last.get(sessionId);
    if (snap) fn(snap); // snapshot for late joiners
    return () => { set?.delete(fn); };
  }
  snapshot(sessionId: string): SessionState | undefined { return this.last.get(sessionId); }
}
