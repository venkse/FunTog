import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createFuntogServer } from "../src/index";

async function withServer(fn: (base: string) => Promise<void>): Promise<void> {
  const server = createFuntogServer();
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try { await fn(`http://127.0.0.1:${port}`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

test("healthz reports ok", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/healthz`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.service, "funtog");
  });
});

test("GET /api/plans returns grounded plan candidates with defaults", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/plans`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.request.groundingMode, "grounded");
    assert.ok(Array.isArray(body.plans) && body.plans.length > 0, "expected at least one plan");
    for (const plan of body.plans) {
      assert.ok(plan.id && plan.arc && Array.isArray(plan.stops));
    }
  });
});

test("POST /api/plans honors the request body", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/plans`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ vibe: "high-energy night out", groundingMode: "shapes", crewConstraints: { veg: true } }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.request.vibe, "high-energy night out");
    assert.equal(body.request.groundingMode, "shapes");
    assert.ok(body.plans.length > 0);
  });
});

test("serves the character demo pages and rejects unknown paths", async () => {
  await withServer(async (base) => {
    const demo = await fetch(`${base}/demo/funtog-mascot.html`);
    assert.equal(demo.status, 200);
    assert.match(demo.headers.get("content-type") ?? "", /text\/html/);

    const missing = await fetch(`${base}/demo/../package.json`);
    assert.equal(missing.status, 404);
  });
});
