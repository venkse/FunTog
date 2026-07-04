// Post-deployment checkout suite: runs against the LIVE site after every Pages deploy.
// Usage: BASE_URL=https://venkse.github.io/FunTog node postdeploy.mjs
// Optional: EXPECT_COMMIT=<sha> — waits (up to ~4 min) until the CDN serves that build.
import { chromium } from "playwright";

const BASE = (process.env.BASE_URL ?? "http://127.0.0.1:8080").replace(/\/$/, "");
const EXPECT_COMMIT = process.env.EXPECT_COMMIT ?? "";
const failures = [];
const ok = (name) => console.log(`  ok   ${name}`);
const fail = (name, detail) => { console.log(`  FAIL ${name}: ${detail}`); failures.push(name); };

// -- 1. wait until the CDN serves the build we just pushed ---------------------------
if (EXPECT_COMMIT) {
  const deadline = Date.now() + 4 * 60_000;
  let last = "unreachable";
  process.stdout.write(`waiting for ${BASE} to serve commit ${EXPECT_COMMIT.slice(0, 7)} `);
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/version.json`, { cache: "no-store" });
      if (res.ok) {
        last = (await res.json()).commit;
        if (last === EXPECT_COMMIT) break;
      } else last = `HTTP ${res.status}`;
    } catch (e) { last = e.message; }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 10_000));
  }
  console.log("");
  if (last !== EXPECT_COMMIT) {
    console.log(`FAIL deployed build never appeared (last saw: ${last})`);
    process.exit(1);
  }
  ok("CDN serves the freshly deployed build");
}

// -- 2. plain HTTP checks -------------------------------------------------------------
const pages = [
  ["/", "text/html"],
  ["/assets/main.js", "javascript"],
  ["/version.json", "json"],
  ["/demo/funtog-mascot.html", "text/html"],
  ["/demo/funtog-characters.html", "text/html"],
  ["/demo/character-exploration.html", "text/html"],
  ["/demo/funtog-helper.html", "text/html"],
];
for (const [path, type] of pages) {
  try {
    const res = await fetch(BASE + path, { cache: "no-store" });
    const ct = res.headers.get("content-type") ?? "";
    if (res.status !== 200) fail(`GET ${path}`, `HTTP ${res.status}`);
    else if (!ct.includes(type)) fail(`GET ${path}`, `content-type ${ct}, wanted ${type}`);
    else ok(`GET ${path}`);
  } catch (e) { fail(`GET ${path}`, e.message); }
}

// -- 3. the main functionality, driven in a real browser ------------------------------
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_BROWSERS_PATH === "/opt/pw-browsers"
    ? { executablePath: "/opt/pw-browsers/chromium" } : {},
);
try {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 30_000 });
  (await page.title()).includes("FunTog") ? ok("index title") : fail("index title", await page.title());

  // grounded mode: expect plan cards with resolved venue names
  await page.click("button[type=submit]");
  try {
    await page.waitForSelector(".plan", { timeout: 10_000 });
    const cards = await page.$$eval(".plan", (els) => els.length);
    cards >= 3 ? ok(`grounded plans render (${cards} cards)`) : fail("grounded plans render", `only ${cards} cards`);
    const venues = await page.$$eval(".plan .stop .what", (els) => els.map((e) => e.textContent.trim()).filter(Boolean));
    venues.length > 0 ? ok(`stops have venues (${venues[0]}, …)`) : fail("stops have venues", "no stop text");
  } catch { fail("grounded plans render", "no .plan card within 10s after clicking Plan my night"); }

  // shapes mode still generates
  await page.selectOption("#mode", "shapes");
  await page.fill("#vibe", "high-energy night out");
  await page.click("button[type=submit]");
  await page.waitForTimeout(1000);
  const shapeCards = await page.$$eval(".plan", (els) => els.length);
  shapeCards >= 3 ? ok("shapes plans render") : fail("shapes plans render", `${shapeCards} cards`);

  // a page reload after submit means JS never attached (the classic silent failure)
  page.url().startsWith(`${BASE}/?`) ? fail("form handled by JS", "page navigated — submit handler not attached") : ok("form handled by JS");

  const realErrors = pageErrors.filter((e) => !e.includes("fonts.googleapis"));
  realErrors.length === 0 ? ok("no page errors") : fail("no page errors", realErrors.join(" | "));
} finally { await browser.close(); }

console.log(failures.length ? `\n${failures.length} check(s) FAILED` : "\nall post-deploy checks passed");
process.exit(failures.length ? 1 : 0);
