# Memory + Ledger — performance & stress suites

Two runnable suites that probe how this component scales toward ~250M crews (~1B users at ~4/crew).

```bash
npm run bench   -w services/memory-ledger   # performance: Big-O of append / read / rebuild / memory
npm run stress  -w services/memory-ledger   # stress: find the knee on each axis + the fix
```
Both scripts pass `--expose-gc` so memory numbers use a clean GC baseline.

## What these are (and are not)
They are a **single-process algorithmic probe**. The signal is *relative scaling* — does cost grow
with input, and how — not absolute production throughput (that depends on the real datastore).
Absolute numbers are machine-specific; the **shape** of each curve is the finding.

## What each measures
- **append throughput** — is append O(1) as the log grows? (windowed ev/s)
- **read latency vs depth** — ledger/persona read cost as a crew's history deepens
- **rebuild vs size** — cost of replaying the log to rebuild projections
- **memory footprint** — bytes/event, bytes/crew, extrapolated to 1B users
- **stress 1–5** — read-latency knee, crew-count ceiling, hot-partition skew, soak/leak, convergence burst

See `../PERF-FINDINGS.md` for the interpreted results and the architectural fixes they point to.
