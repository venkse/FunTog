import type { NightRecord } from "@funtog/contracts";

export interface CrewTimeline {
  crewId: string;
  level: number;
  nights: { nightId: string; timestamp: string; verdict: NightRecord["verdict"] }[];
}

/** The crew's story so far — the nostalgia payoff, same log as the training signal. */
export function foldTimeline(crewId: string, nights: NightRecord[]): CrewTimeline {
  return {
    crewId,
    level: nights.length,
    nights: nights.map((n) => ({ nightId: n.nightId, timestamp: n.timestamp, verdict: n.verdict })),
  };
}
