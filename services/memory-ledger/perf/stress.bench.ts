/**
 * Memory + Ledger — stress suite.
 * Pushes each scaling axis until something gives, and reports the knee + an extrapolation toward
 * ~250M crews (~1B users). Single-process probe: it finds WHERE the pilot design breaks and which
 * architectural lever fixes it, not absolute production capacity.
 */
import { InMemoryEventStore, ProjectionStore } from "../src/index";
import { meanPerOp, eachMs, pctl, us, heapUsed, rawHeap, gc, nightEvent } from "./util";

const bar = "=".repeat(66);
const header = (t: string) => { console.log("\n" + bar + "\n" + t + "\n" + bar); };

function readKnee() {
  header("STRESS 1 — read-latency knee vs per-crew log depth");
  const THRESH_US = 1000; // 1 ms median ledger read
  let knee = -1;
  for (const d of [1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 100_000, 200_000]) {
    const store = new InMemoryEventStore(); const proj = new ProjectionStore();
    store.subscribe((e) => proj.apply(e));
    for (let i = 0; i < d; i++) store.append(nightEvent("c1", i));
    const lg = meanPerOp(100, () => { proj.ledger("c1"); }) * 1000;
    console.log(`  depth ${String(d).padStart(7)} → ledger read ${lg.toFixed(1).padStart(8)} µs`);
    if (knee < 0 && lg > THRESH_US) knee = d;
  }
  console.log(`  => crosses ${THRESH_US} µs at ~${knee > 0 ? knee.toLocaleString() : ">200k"} nights/crew`);
  console.log("     fix: materialized projection (incremental) + periodic snapshot so reads are O(1)");
}

function crewCeiling() {
  header("STRESS 2 — crew-count ceiling in one process");
  const BUDGET_MB = 300;
  const base = heapUsed();
  const store = new InMemoryEventStore(); const proj = new ProjectionStore();
  store.subscribe((e) => proj.apply(e));
  let c = 0;
  while ((heapUsed() - base) / 1048576 < BUDGET_MB) {
    const stop = c + 10_000;
    for (; c < stop; c++) for (let i = 0; i < 4; i++) store.append(nightEvent(`c${c}`, i));
  }
  const usedMb = (heapUsed() - base) / 1048576;
  const crewsPerGb = c / (usedMb / 1024);
  console.log(`  fit ${c.toLocaleString()} crews in ${usedMb.toFixed(0)} MB → ~${Math.round(crewsPerGb).toLocaleString()} crews/GB`);
  console.log(`  => ~250M crews ⇒ ~${Math.round(250_000_000 / crewsPerGb).toLocaleString()} GB of resident state`);
  console.log("     mandates external partitioned storage; the process caches only hot crews");
  void proj;
}

function hotPartition() {
  header("STRESS 3 — hot-partition skew (one super-crew)");
  const store = new InMemoryEventStore(); const proj = new ProjectionStore();
  store.subscribe((e) => proj.apply(e));
  for (let c = 0; c < 10_000; c++) { store.append(nightEvent(`s${c}`, 0)); store.append(nightEvent(`s${c}`, 1)); }
  const HOT = 200_000;
  for (let i = 0; i < HOT; i++) store.append(nightEvent("HOT", i));
  const shallow = meanPerOp(200, () => { proj.ledger("s5000"); }) * 1000;
  const hot = meanPerOp(50, () => { proj.ledger("HOT"); }) * 1000;
  console.log(`  shallow crew (2 nights):       ${shallow.toFixed(1).padStart(8)} µs`);
  console.log(`  hot crew (${HOT.toLocaleString()} nights):  ${hot.toFixed(1).padStart(8)} µs  (${(hot / shallow).toFixed(0)}× slower)`);
  console.log("  => partitioning isolates blast radius (shallow crews stay fast) — but fold-on-read punishes the hot one");
}

function soak() {
  header("STRESS 4 — soak / leak (sustained mixed workload, 3s)");
  const store = new InMemoryEventStore(); const proj = new ProjectionStore();
  store.subscribe((e) => proj.apply(e));
  gc(); const start = rawHeap(); const t0 = Date.now(); let i = 0, ops = 0;
  let firstMb = 0, lastMb = 0;
  while (Date.now() - t0 < 3000) {
    for (let k = 0; k < 5000; k++) { const cr = `c${i % 20000}`; store.append(nightEvent(cr, i)); if ((i & 7) === 0) proj.ledger(cr); i++; ops++; }
    lastMb = (rawHeap() - start) / 1048576;
    if (firstMb === 0) firstMb = lastMb;
  }
  const dur = (Date.now() - t0) / 1000;
  console.log(`  ${ops.toLocaleString()} appends in ${dur.toFixed(1)}s (${(ops / dur).toFixed(0)} ev/s)`);
  console.log(`  heap delta ${firstMb.toFixed(0)} → ${lastMb.toFixed(0)} MB over the run`);
  console.log("  => store retains the whole log: growth is unbounded by design ⇒ durable store + retention/snapshots");
}

function burst() {
  header("STRESS 5 — convergence burst (many crews reading at once)");
  const store = new InMemoryEventStore(); const proj = new ProjectionStore();
  store.subscribe((e) => proj.apply(e));
  const CREWS = 50_000;
  for (let c = 0; c < CREWS; c++) for (let i = 0; i < 3; i++) store.append(nightEvent(`c${c}`, i));
  const READS = 200_000;
  const durs = eachMs(READS, () => { proj.ledger(`c${(Math.random() * CREWS) | 0}`); });
  const total = durs.reduce((a, b) => a + b, 0);
  console.log(`  ${READS.toLocaleString()} ledger reads across ${CREWS.toLocaleString()} crews`);
  console.log(`  ${(READS / (total / 1000)).toFixed(0)} reads/s   p50 ${us(pctl(durs, 50))} µs   p99 ${us(pctl(durs, 99))} µs`);
  console.log("  => single Node process read ceiling on shallow crews; scale via stateless read replicas over the store");
}

console.log("FunTog · Memory + Ledger · STRESS SUITE");
console.log("(finds the knee on each axis + maps it to the architectural fix)");
readKnee();
crewCeiling();
hotPartition();
soak();
burst();
console.log("\nDone.\n");
