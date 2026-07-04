import type { Vote, Tally } from "@funtog/contracts";

export interface VoteEvent extends Vote { seq: number; at: number; }

/**
 * Append-only vote log (event-sourced). Idempotent + last-write-wins per member by clientSeq:
 * a member may change their vote; a stale or duplicate clientSeq is ignored. The tally is a
 * projection of the latest vote per member.
 */
export class VoteLog {
  private events: VoteEvent[] = [];
  private latest = new Map<string, VoteEvent>();

  append(v: Vote, at: number): boolean {
    const prev = this.latest.get(v.memberId);
    if (prev && prev.clientSeq >= v.clientSeq) return false; // stale / duplicate → ignore
    const ev: VoteEvent = { ...v, seq: this.events.length + 1, at };
    this.events.push(ev);
    this.latest.set(v.memberId, ev);
    return true;
  }
  tally(): Tally {
    const t: Tally = {};
    for (const ev of this.latest.values()) t[ev.planId] = (t[ev.planId] ?? 0) + 1;
    return t;
  }
  voters(): { memberId: string; planId: string }[] {
    return [...this.latest.values()].map((e) => ({ memberId: e.memberId, planId: e.planId }));
  }
  all(): readonly VoteEvent[] { return this.events; }
}
