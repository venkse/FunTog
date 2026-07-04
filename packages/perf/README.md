# @funtog/perf

Shared performance + stress harness for every subsystem. Zero-dependency (node:perf_hooks).
Timing, percentiles, memory sampling, async latency/throughput runners, and a 1B-user
extrapolation helper. Each service's `perf/perf.bench.ts` and `perf/stress.bench.ts` import from
here and add subsystem-specific scenarios. See `docs/SCALING.md` for the bottleneck map.

These are **single-process algorithmic probes**: the signal is *relative scaling* (does cost grow
with input?), not production absolutes.
