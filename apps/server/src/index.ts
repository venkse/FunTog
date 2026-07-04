// FunTog demo server: the deployable surface of the monorepo. Wires the real
// suggestion-engine + venue-knowledge services (deterministic stub provider) behind a
// tiny HTTP API and serves the character demo pages. No framework, no build step.
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { createSuggestion } from "@funtog/suggestion-engine";
import { createVenue } from "@funtog/venue-knowledge";
import type { PlanRequest } from "@funtog/contracts";

const ASSETS_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../../services/character-engine/assets");
const DEMO_PAGES = new Set([
  "character-exploration.html", "funtog-characters.html", "funtog-helper.html", "funtog-mascot.html",
]);

const startedAt = Date.now();

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body, null, 2));
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

// Accepts a partial request (from query params or JSON body) and fills demo defaults,
// so `curl /api/plans` works with zero arguments.
function toPlanRequest(input: Record<string, unknown>): PlanRequest {
  return {
    crewId: typeof input.crewId === "string" ? input.crewId : "demo-crew",
    vibe: typeof input.vibe === "string" ? input.vibe : "chill birthday dinner",
    area: typeof input.area === "string" ? input.area : "shoreditch",
    budget: typeof input.budget === "string" ? input.budget : undefined,
    crewConstraints: (input.crewConstraints as PlanRequest["crewConstraints"]) ?? {},
    groundingMode: input.groundingMode === "shapes" ? "shapes" : "grounded",
  };
}

export function createFuntogServer(): Server {
  const suggestion = createSuggestion({ venue: createVenue() });

  return createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    try {
      if (url.pathname === "/healthz") {
        return json(res, 200, {
          ok: true,
          service: "funtog",
          commit: process.env.GIT_SHA ?? "dev",
          uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
        });
      }

      if (url.pathname === "/api/plans" && (req.method === "GET" || req.method === "POST")) {
        const input = req.method === "POST" ? await readBody(req) : Object.fromEntries(url.searchParams);
        const planReq = toPlanRequest(input);
        const plans = await suggestion.generatePlans(planReq);
        return json(res, 200, { request: planReq, plans });
      }

      const demoPage = url.pathname.replace(/^\/demo\//, "");
      if (url.pathname.startsWith("/demo/") && DEMO_PAGES.has(demoPage)) {
        const html = await readFile(join(ASSETS_DIR, demoPage), "utf8");
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        return res.end(html);
      }

      if (url.pathname === "/") {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        return res.end(`<!doctype html><meta charset="utf-8"><title>FunTog</title>
<body style="font-family:system-ui;max-width:40rem;margin:3rem auto;line-height:1.6">
<h1>FunTog</h1><p>A character-driven group event planner.</p>
<h2>API</h2><ul>
<li><a href="/healthz">GET /healthz</a> — liveness + build info</li>
<li><a href="/api/plans">GET /api/plans</a> — demo plan generation (params: <code>vibe</code>, <code>area</code>, <code>groundingMode</code>)</li>
</ul>
<h2>Character demos</h2><ul>
${[...DEMO_PAGES].map((p) => `<li><a href="/demo/${p}">${p}</a></li>`).join("\n")}
</ul></body>`);
      }

      json(res, 404, { error: "not found" });
    } catch (err) {
      json(res, 500, { error: (err as Error).message });
    }
  });
}

// Start listening only when run directly (not when imported by tests).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.PORT ?? 3000);
  createFuntogServer().listen(port, () => {
    console.log(`funtog server listening on :${port} (commit ${process.env.GIT_SHA ?? "dev"})`);
  });
}
