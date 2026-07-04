// Browser entry: runs the real suggestion-engine + venue-knowledge services client-side.
import { createSuggestion } from "@funtog/suggestion-engine";
import { createVenue } from "@funtog/venue-knowledge";
import type { PlanCandidate, PlanStop } from "@funtog/contracts";

// suggestion-engine clones plans with structuredClone (missing on pre-2022 browsers);
// its plan objects are plain JSON data, so this fallback is lossless
if (typeof globalThis.structuredClone !== "function") {
  globalThis.structuredClone = (<T,>(x: T): T => JSON.parse(JSON.stringify(x))) as typeof structuredClone;
}

const suggestion = createSuggestion({ venue: createVenue() });

const form = document.getElementById("form") as HTMLFormElement;
const vibeEl = document.getElementById("vibe") as HTMLInputElement;
const areaEl = document.getElementById("area") as HTMLInputElement;
const modeEl = document.getElementById("mode") as HTMLSelectElement;
const plansEl = document.getElementById("plans") as HTMLElement;
const emptyEl = document.getElementById("empty") as HTMLElement;

function stopRow(stop: PlanStop): HTMLElement {
  const row = document.createElement("div");
  row.className = "stop";
  const time = document.createElement("time");
  time.textContent = stop.time;
  const what = document.createElement("span");
  what.className = "what";
  what.textContent = stop.venue?.name ?? stop.slot?.venueType ?? "somewhere fun";
  row.append(time, what);
  const tags = [
    stop.venue ? "" : stop.slot?.priceBand ?? "",
    ...(stop.satisfiedConstraints ?? []),
  ].filter(Boolean);
  if (tags.length) {
    const t = document.createElement("span");
    t.className = "tags";
    t.textContent = tags.join(" · ");
    row.append(t);
  }
  return row;
}

function planCard(plan: PlanCandidate): HTMLElement {
  const card = document.createElement("article");
  card.className = "plan";
  const title = document.createElement("h3");
  title.textContent = plan.arc;
  card.append(title, ...plan.stops.map(stopRow));
  return card;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  emptyEl.textContent = "plotting…";
  const plans = await suggestion.generatePlans({
    crewId: "web-demo",
    vibe: vibeEl.value.trim() || "chill birthday dinner",
    area: areaEl.value.trim() || "shoreditch",
    crewConstraints: {},
    groundingMode: modeEl.value === "shapes" ? "shapes" : "grounded",
  });
  plansEl.replaceChildren(...plans.map(planCard));
  emptyEl.textContent = "";
});
