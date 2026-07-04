/**
 * Memory + Ledger — performance suite.
 * A single-process Big-O probe: it measures ALGORITHMIC scaling (does cost grow with input?),
 * not production absolute throughput (that depends on the real datastore). The point is to find
 * where the in-memory / fold-on-read pilot stops scaling toward ~250M crews (~1B users).
 */
import { InMemoryEventStore, ProjectionStore } from "../src/index";
import { timeTotal, meanPerOp, mb, us, heapUsed, nightEvent } from "./util";

const bar = "-".repeat(66);
const header = (t: string) => { console.log("\n" + bar + "\n" + t + "\n" + bar); };

function appendThroughput() {
  header("APPEND THROUGHPUT — is append O(1)?");
  const store = new InMemoryEventStore(); const proj = new ProjectionStore();
  store.subscribe((e) => proj.apply(e));
  const N = 200_000, W = 50_000;
  for (let w = 0; w < N / W; w++) {
    const t = timeTotal(() => { for (let i = w * W; i < (w + 1) * W; i++) store.append(nightEvent("c1", i)); });
    console.log(`  events ${(w * W).toLocaleString().padStart(9)}–${((w + 1) * W).toLocaleString().padStart(9)}: ${(W / (t / 1000)).toFixed(0).padStart(9)} ev/s`);
  }
  console.log("  => throughput flat across windows ⇒ append stays O(1) regardless of log size");
}

function readVsDepth() {
  header("READ LATENCY vs LOG DEPTH — the fold-on-read bottleneck");
  console.log("  depth        ledger(µs)   persona(µs)");
  for (const d of [100, 1_000, 10_000, 100_000]) {
    const store = new InMemoryEventStore(); const proj = new ProjectionStore();
    store.subscribe((e) => proj.apply(e));
    for (let i = 0; i < d; i++) store.append(nightEvent("c1", i));
    const lg = meanPerOp(200, () => { proj.ledger("c1"); });
    const ps = meanPerOp(200, () => { proj.persona("c1"); });
    console.log(`  ${String(d).padEnd(10)}  ${us(lg).padStart(9)}   ${us(ps).padStart(9)}`);
  }
  console.log("  => latency grows ~linearly with per-crew depth: projections recomputed every read");
}

function rebuildVsSize() {
  header("REPLAY / REBUILD COST vs TOTAL LOG SIZE");
  console.log("  events       rebuild(ms)    ev/s");
  for (const n of [10_000, 100_000, 500_000]) {
    const store = new InMemoryEventStore();
    for (let i = 0; i < n; i++) store.append(nightEvent(`c${i % 1000}`, i));
    const proj = new ProjectionStore();
    const t = timeTotal(() => proj.rebuildFrom(store.all()));
    console.log(`  ${String(n).padEnd(11)}  ${t.toFixed(0).padStart(10)}   ${(n / (t / 1000)).toFixed(0).padStart(9)}`);
  }
  console.log("  => rebuild is O(total events): a global synchronous replay won't scale; rebuild per-crew");
}

function memoryFootprint() {
  header("MEMORY FOOTPRINT + EXTRAPOLATION TO ~1B USERS");
  const crews = 50_000, perCrew = 4;
  const base = heapUsed();
  const store = new InMemoryEventStore(); const proj = new ProjectionStore();
  store.subscribe((e) => proj.apply(e));
  for (let c = 0; c < crews; c++) for (let i = 0; i < perCrew; i++) store.append(nightEvent(`c${c}`, i));
  const used = heapUsed() - base;
  const events = crews * perCrew;
  console.log(`  ${events.toLocaleString()} events / ${crews.toLocaleString()} crews → heap ${mb(used)} MB`);
  console.log(`  ~${(used / events).toFixed(0)} B/event   ~${(used / crews).toFixed(0)} B/crew`);
  const TARGET = 250_000_000; // ~1B users / 4
  console.log(`  extrapolated to ${TARGET.toLocaleString()} crews: ~${((used / crews) * TARGET / 1e12).toFixed(1)} TB resident (just current state)`);
  console.log("  => single-process in-memory is infeasible; needs a durable, crew-partitioned store");
  void proj;
}

console.log("FunTog · Memory + Ledger · PERFORMANCE SUITE");
console.log("(single-process algorithmic probe — relative scaling, not production absolutes)");
appendThroughput();
readVsDepth();
rebuildVsSize();
memoryFootprint();
console.log("\nDone.\n");
