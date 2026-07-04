import type { WheelResult } from "./session";

// CANONICAL wheel authority. The server picks once; clients animate to the SAME result.
// Deterministic given a seed, equal-weight across contenders. Shared so server + clients agree.
export function pickWheelResult(contenders: string[], seed: string): WheelResult {
  if (contenders.length === 0) throw new Error("pickWheelResult: no contenders");
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  const idx = h % contenders.length;
  return { planId: contenders[idx], seed };
}
