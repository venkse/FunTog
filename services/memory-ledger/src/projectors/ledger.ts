import type { NightRecord, LedgerSnapshot, MemberLedger } from "@funtog/contracts";

/**
 * Fairness ledger = a pure fold over a crew's NightRecords.
 * A voter "got" the night if their vote matched the winning plan, else they were "overruled".
 * `streak` counts consecutive overruled outcomes (reset on a win) — this is what FunTog reads
 * to advocate for whoever's owed. A wheel verdict is a fair spin and overrules no one.
 */
export function foldLedger(crewId: string, nights: NightRecord[]): LedgerSnapshot {
  const members = new Map<string, MemberLedger>();
  const ensure = (id: string): MemberLedger => {
    let m = members.get(id);
    if (!m) { m = { memberId: id, got: 0, overruled: 0, streak: 0 }; members.set(id, m); }
    return m;
  };

  for (const night of nights) {
    const winner = night.verdict.type === "winner" ? night.verdict.planId : undefined;
    for (const v of night.votes) ensure(v.memberId);   // record participation
    if (winner === undefined) continue;                 // wheel: fair, nobody overruled
    for (const v of night.votes) {
      const m = ensure(v.memberId);
      if (v.planId === winner) { m.got += 1; m.streak = 0; }
      else { m.overruled += 1; m.streak += 1; }
    }
  }
  return { crewId, members: [...members.values()] };
}
