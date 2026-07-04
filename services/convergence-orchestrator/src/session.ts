import type {
  SessionState, SessionPhase, PlanCandidate, VoicePacket, Vote, Verdict,
  LedgerSnapshot, NightRecord, MemoryService, PersistedSession, SessionStore,
} from "@funtog/contracts";
import { assertTransition } from "./state-machine";
import { VoteLog } from "./vote-log";
import { decideVerdict } from "./verdict";
import { spin } from "./wheel";
import type { Broadcaster } from "./broadcaster";

export interface SessionDeps {
  memory: MemoryService;
  broadcaster: Broadcaster;
  now: () => number;
  seedFn: () => string;
  sparkInput: Record<string, unknown>;
  store?: SessionStore;   // durability: checkpoint on change, rehydrate on miss (contracts 0.3.0)
}

/**
 * One session = one actor = the single-writer for that sessionId. All mutations are serialized
 * through an internal queue, so votes apply in a well-defined order without shared-state races.
 * This is the unit the fleet shards on (one owner per sessionId).
 */
export class SessionActor {
  private state: SessionState;
  private votes = new VoteLog();
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    public readonly sessionId: string,
    crewId: string,
    candidates: PlanCandidate[],
    voice: VoicePacket | undefined,
    private deps: SessionDeps,
  ) {
    this.state = { sessionId, crewId, phase: "draft", candidates, voice, tally: {} };
  }

  /**
   * Rebuild a live actor from its persisted record: restore the snapshot, then replay the vote
   * history through a fresh VoteLog (clientSeq is preserved, so LWW semantics reproduce exactly).
   * A resolved session rehydrates as resolved — reads work, mutations are no-ops.
   */
  static rehydrate(p: PersistedSession, deps: SessionDeps): SessionActor {
    const a = new SessionActor(p.sessionId, p.crewId, p.snapshot.candidates, p.snapshot.voice, deps);
    a.state = structuredClone(p.snapshot);
    for (const v of p.votes) a.votes.append(v, v.at);
    return a;
  }

  /** The session's full recoverable record (snapshot + replayable vote history). */
  toPersisted(): PersistedSession {
    return {
      sessionId: this.sessionId,
      crewId: this.state.crewId,
      sparkInput: this.deps.sparkInput,
      snapshot: this.getState(),
      votes: this.votes.all().map(({ seq: _seq, ...v }) => v),
    };
  }

  /**
   * Availability-first durability (same stance as the NightRecord append): a store outage must
   * not take voting down — prod pairs this with buffered retries. The window between a failed
   * checkpoint and the next successful one is the accepted crash-loss bound.
   */
  private async checkpoint(): Promise<void> {
    if (!this.deps.store) return;
    try { await this.deps.store.save(this.toPersisted()); }
    catch { /* store down -> keep serving; next successful checkpoint heals */ }
  }

  private run<T>(fn: () => Promise<T> | T): Promise<T> {
    const next = this.queue.then(() => fn());
    this.queue = next.catch(() => {}); // keep the chain alive; caller still sees errors
    return next;
  }

  getState(): SessionState { return structuredClone(this.state); }

  open(): Promise<void> {
    return this.run(async () => { this.transition("gathering"); this.publish(); await this.checkpoint(); });
  }

  castVote(v: Vote): Promise<void> {
    return this.run(async () => {
      if (this.state.phase !== "gathering") return; // votes only while gathering
      if (this.votes.append(v, this.deps.now())) {
        this.state.tally = this.votes.tally();
        this.publish();
        await this.checkpoint();
      }
    });
  }

  converge(): Promise<void> {
    return this.run(async () => {
      if (this.state.phase !== "gathering") return;
      this.transition("converging");
      this.state.tally = this.votes.tally();

      let ledger: LedgerSnapshot | undefined;
      try { ledger = await this.deps.memory.getLedgerSnapshot(this.state.crewId); }
      catch { ledger = undefined; } // ledger read down → decide on votes only

      let verdict = decideVerdict(this.state.tally, ledger, this.votes.voters());

      if (verdict.type === "wheel" && verdict.contenders.length > 1) {
        this.state.verdict = verdict;
        this.transition("spinning");
        this.publish(); // clients animate the spin to the broadcast result
        this.state.wheelResult = spin(verdict.contenders, this.deps.seedFn());
        this.transition("resolved");
      } else {
        if (verdict.type === "wheel") {
          verdict = verdict.contenders[0] ? { type: "winner", planId: verdict.contenders[0] } : verdict;
        }
        this.state.verdict = verdict;
        this.transition("resolved");
      }

      this.publish();
      await this.checkpoint();
      await this.persist(); // archive-on-resolve: hand the night to Memory
    });
  }

  private async persist(): Promise<void> {
    const verdict = this.state.verdict as Verdict | undefined;
    if (!verdict) return;
    const record: NightRecord = {
      nightId: this.sessionId,
      crewId: this.state.crewId,
      timestamp: new Date(this.deps.now()).toISOString(),
      sparkInput: this.deps.sparkInput,
      candidatePlans: this.state.candidates,
      votes: this.votes.voters(),
      verdict: { ...verdict, wheelSeed: this.state.wheelResult?.seed },
      fairnessCall: verdict.type === "winner" && verdict.fairnessFor
        ? { for: verdict.fairnessFor, applied: true } : undefined,
    };
    try { await this.deps.memory.appendNightRecord(record); }
    catch { /* durable append: prod buffers + retries; the core has already resolved */ }
  }

  private transition(to: SessionPhase): void {
    assertTransition(this.state.phase, to);
    this.state.phase = to;
  }
  private publish(): void { this.deps.broadcaster.publish(this.sessionId, this.getState()); }
}
