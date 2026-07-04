import type { SessionStore, PersistedSession,
  OrchestratorService, SuggestionService, CharacterService, MemoryService,
  Vote, PlanRequest, CrewConstraints,
} from "@funtog/contracts";
import { GenerationCoordinator } from "./generation-coordinator";
import { InMemoryBroadcaster, type Broadcaster } from "./broadcaster";
import { SessionActor } from "./session";
import { newSeed } from "./wheel";

export interface OrchestratorDeps {
  suggestion: SuggestionService;
  character: CharacterService;
  memory: MemoryService;
  broadcaster?: Broadcaster;     // default in-memory; in prod the stateless pub/sub tier
  now?: () => number;
  seedFn?: () => string;         // injectable for deterministic tests
  genTimeoutMs?: number;
  /**
   * Mints the shareable join token for a session. Token minting BELONGS to Crew/Identity —
   * wire `crew.issueJoinToken` here for signed stateless links. Default is the identity
   * function (the link IS the session ref), which Crew/Identity's opaque path resolves as-is.
   * (Found by the golden-night e2e: the old `jt_`-prefixed token didn't round-trip.)
   */
  mintJoinToken?: (sessionId: string, crewId: string) => string;
  /** Durability port (contracts 0.3.0): checkpoint on change, rehydrate on miss. Default: none (pure in-memory). */
  store?: SessionStore;
}

/**
 * Convergence Orchestrator. Owns live sessions; mediates Suggestion↔Character (they never call each
 * other). The session registry is the sessionId partition — one owner (actor) per session, which is
 * exactly the unit the fleet shards on.
 */
export function createOrchestrator(deps: OrchestratorDeps): OrchestratorService {
  const broadcaster = deps.broadcaster ?? new InMemoryBroadcaster();
  const now = deps.now ?? (() => Date.now());
  const seedFn = deps.seedFn ?? newSeed;
  const gen = new GenerationCoordinator(deps.suggestion, deps.character, { timeoutMs: deps.genTimeoutMs });
  const sessions = new Map<string, SessionActor>();
  const mint = deps.mintJoinToken ?? ((sid: string) => sid);
  let counter = 0;

  const resolve = async (sessionId: string): Promise<SessionActor> => {
    const hit = sessions.get(sessionId);
    if (hit) return hit;
    if (deps.store) {                                   // cache miss → try rehydration
      const p = await deps.store.load(sessionId);
      if (p) {
        const actor = SessionActor.rehydrate(p, { memory: deps.memory, broadcaster, now, seedFn, sparkInput: p.sparkInput, store: deps.store });
        sessions.set(sessionId, actor);                 // this process now owns the session
        return actor;
      }
    }
    throw new Error(`unknown session ${sessionId}`);
  };

  return {
    async openSession(crewId, sparkInput) {
      const spark = sparkInput as { vibe?: string; area?: string; crewConstraints?: CrewConstraints; groundingMode?: string };
      const sessionId = `s_${now()}_${++counter}`;
      const req: PlanRequest = {
        crewId, vibe: spark.vibe ?? "big night", area: spark.area,
        crewConstraints: spark.crewConstraints ?? {},
        // Spark may request grounded plans (real venues); anything else stays in safe shapes mode.
        groundingMode: spark.groundingMode === "grounded" ? "grounded" : "shapes",
      };
      const { plans } = await gen.plans(req);        // real or template — never blocks
      const voice = await gen.voice(crewId, plans);  // enrichment only
      const actor = new SessionActor(sessionId, crewId, plans, voice, { memory: deps.memory, broadcaster, now, seedFn, sparkInput, store: deps.store });
      sessions.set(sessionId, actor);
      await actor.open();
      return { sessionId, joinToken: mint(sessionId, crewId) };
    },
    async castVote(v: Vote) { await (await resolve(v.sessionId)).castVote(v); },
    async converge(sessionId) { await (await resolve(sessionId)).converge(); },
    async getState(sessionId) { return (await resolve(sessionId)).getState(); },
  };
}

// re-exports for unit tests + integration wiring
export { InMemoryBroadcaster } from "./broadcaster";
export { GenerationCoordinator, templatePlans } from "./generation-coordinator";
export { SessionActor } from "./session";
export { decideVerdict, mostOwed } from "./verdict";
export { spin, newSeed } from "./wheel";
export { VoteLog } from "./vote-log";
export { canTransition, assertTransition } from "./state-machine";

/** Reference SessionStore: the pilot default when durability is wanted without infra. */
export class InMemorySessionStore implements SessionStore {
  private m = new Map<string, PersistedSession>();
  async save(s: PersistedSession): Promise<void> { this.m.set(s.sessionId, structuredClone(s)); }
  async load(sessionId: string): Promise<PersistedSession | null> {
    const p = this.m.get(sessionId);
    return p ? structuredClone(p) : null;
  }
}
