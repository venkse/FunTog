import type { WheelResult } from "@funtog/contracts";
import { createHash, randomBytes } from "node:crypto";

/** Server-side wheel authority: ONE seed chosen here, broadcast to all clients, verifiable. */
export function newSeed(): string { return randomBytes(16).toString("hex"); }

/**
 * Equal-slice selection from a seed. Deterministic and verifiable: any client with (contenders, seed)
 * can recompute the result, so the spin can't be rigged. Equal slices ⇒ honest odds (fairness is
 * applied earlier, in the Verdict Engine — never by weighting the wheel).
 */
export function spin(contenders: string[], seed: string): WheelResult {
  if (contenders.length === 0) throw new Error("wheel requires at least one contender");
  const digest = createHash("sha256").update(seed).digest();
  const n = digest.readUIntBE(0, 6); // 48-bit, ample for any realistic contender count
  return { planId: contenders[n % contenders.length], seed };
}
