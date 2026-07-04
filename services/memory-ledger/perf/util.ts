export * from "@funtog/perf";
import type { NightRecord } from "@funtog/contracts";

const MEMBERS = ["riya", "sam", "maya", "dev"];
export function makeNight(crewId: string, i: number): NightRecord {
  return {
    nightId: `${crewId}-n${i}`, crewId,
    timestamp: new Date(2026, 0, 1 + (i % 365)).toISOString(),
    sparkInput: { vibe: "big night", area: "soho" }, candidatePlans: [],
    votes: MEMBERS.map((m, k) => ({ memberId: m, planId: `p${(i + k) % 3}` })),
    verdict: { type: "winner", planId: `p${i % 3}` },
  };
}
export function nightEvent(crewId: string, i: number) {
  const n = makeNight(crewId, i);
  return { type: "night_recorded" as const, crewId, timestamp: n.timestamp, payload: n };
}
