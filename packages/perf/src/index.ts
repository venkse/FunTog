import { performance } from "node:perf_hooks";

export const now = () => performance.now();
export function timeTotal(fn: () => void): number { const t = now(); fn(); return now() - t; }

export function meanPerOp(reps: number, fn: () => void): number {
  for (let i = 0; i < Math.min(reps, 50); i++) fn();
  const t = now(); for (let i = 0; i < reps; i++) fn(); return (now() - t) / reps;
}
export function eachMs(reps: number, fn: () => void): number[] {
  const xs = new Array<number>(reps);
  for (let i = 0; i < reps; i++) { const t = now(); fn(); xs[i] = now() - t; }
  return xs;
}
export function pctl(xs: number[], p: number): number {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
}

export const mb = (b: number) => (b / 1048576).toFixed(1);
export const us = (ms: number) => (ms * 1000).toFixed(1);
export const gc = () => (globalThis as { gc?: () => void }).gc?.();
export const rawHeap = () => process.memoryUsage().heapUsed;
export function heapUsed() { gc(); return process.memoryUsage().heapUsed; }

export function section(title: string): void {
  const bar = "=".repeat(Math.max(title.length, 60));
  console.log("\n" + bar + "\n" + title + "\n" + bar);
}

/** time an async op `reps` times; print p50/p99; return durations (ms). */
export async function latency(label: string, reps: number, fn: () => Promise<void> | void): Promise<number[]> {
  for (let i = 0; i < Math.min(reps, 20); i++) await fn();
  const xs = new Array<number>(reps);
  for (let i = 0; i < reps; i++) { const t = now(); await fn(); xs[i] = now() - t; }
  console.log(`  ${label}: p50 ${us(pctl(xs, 50))} µs   p99 ${us(pctl(xs, 99))} µs   (${reps} ops)`);
  return xs;
}

/** run an async op for ~durationMs; print ops/sec; return op count. */
export async function throughput(label: string, durationMs: number, fn: () => Promise<void> | void): Promise<number> {
  const t0 = now(); let ops = 0;
  while (now() - t0 < durationMs) { await fn(); ops++; }
  const dur = (now() - t0) / 1000;
  console.log(`  ${label}: ${(ops / dur).toFixed(0)} ops/s   (${ops} ops in ${dur.toFixed(1)}s)`);
  return ops;
}

/** print a scenario plan when a service isn't implemented yet (the suite as executable spec). */
export function plan(title: string, scenarios: string[], runHint: string): void {
  console.log(`${title} — not implemented yet. This suite WILL measure once built:`);
  for (const s of scenarios) console.log("  - " + s);
  console.log(`\nBuild the service, then re-run: ${runHint}`);
}

export function extrapolate(perUnitBytes: number, units: number, label = "resident"): string {
  const total = perUnitBytes * units;
  const v = total >= 1e12 ? `${(total / 1e12).toFixed(1)} TB` : `${(total / 1e9).toFixed(1)} GB`;
  return `${label}: ~${v} for ${units.toLocaleString()} units`;
}

/** ~1B users at ~4 per crew. */
export const CREWS_1B_USERS = 250_000_000;
