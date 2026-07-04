import type { Tally, Verdict, LedgerSnapshot } from "@funtog/contracts";

/**
 * Deterministic Verdict Engine. Pure function of (tally, ledger, voters).
 * - clear top → winner
 * - tie → FAIRNESS leans the verdict toward the most-owed member whose pick is tied
 *   (fairness lives UPSTREAM of the wheel; the wheel is never weighted)
 * - tie with no fairness signal → wheel between the tied contenders (an equal spin)
 */
export function decideVerdict(
  tally: Tally,
  ledger?: LedgerSnapshot,
  voters?: { memberId: string; planId: string }[],
): Verdict {
  const entries = Object.entries(tally);
  if (entries.length === 0) return { type: "wheel", contenders: [] };

  const max = Math.max(...entries.map(([, n]) => n));
  const contenders = entries.filter(([, n]) => n === max).map(([id]) => id);
  if (contenders.length === 1) return { type: "winner", planId: contenders[0] };

  if (ledger && voters) {
    const owed = mostOwed(ledger);
    if (owed) {
      const pick = voters.find((v) => v.memberId === owed && contenders.includes(v.planId));
      if (pick) return { type: "winner", planId: pick.planId, fairnessFor: owed };
    }
  }
  return { type: "wheel", contenders };
}

/** the member most "owed" a win: highest current overruled streak, breaking ties by total overruled. */
export function mostOwed(ledger: LedgerSnapshot): string | undefined {
  let best: { id: string; streak: number; overruled: number } | undefined;
  for (const m of ledger.members) {
    if (m.streak <= 0) continue;
    if (!best || m.streak > best.streak || (m.streak === best.streak && m.overruled > best.overruled)) {
      best = { id: m.memberId, streak: m.streak, overruled: m.overruled };
    }
  }
  return best?.id;
}
