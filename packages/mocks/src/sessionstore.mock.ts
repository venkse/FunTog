import type { SessionStore, PersistedSession } from "@funtog/contracts";

/** Contract-faithful in-memory SessionStore: upsert save, clone-isolated load, null on miss. */
export const mockSessionStore = (): SessionStore => {
  const m = new Map<string, PersistedSession>();
  return {
    async save(s) { m.set(s.sessionId, structuredClone(s)); },
    async load(id) { const p = m.get(id); return p ? structuredClone(p) : null; },
  };
};
