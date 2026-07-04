// THE swamp boundary. Everything external (Places/Maps, rate limits, coverage gaps, freshness)
// lives behind this seam. The REAL provider implements the same interface; NO other subsystem ever
// imports a Places SDK. The default below is a deterministic in-memory stand-in.

export interface RawPlace {
  id: string;
  title: string;
  kind: string;                                   // normalized category
  price: "cheap" | "comfortable" | "splashing";
  tags: string[];
  open: boolean;
}

export interface PlacesProvider {
  /** Candidate places for a venue type in an area. THROWS on provider failure / rate-limit. */
  lookup(area: string, venueType: string): Promise<RawPlace[]>;
}

const COVERED = new Set(["soho", "shoreditch", "dalston", "peckham", "clerkenwell"]);
export function isCovered(area: string): boolean { return COVERED.has(area.trim().toLowerCase()); }

const ADJ = ["Velvet", "Neon", "Crimson", "Golden", "Sly", "Midnight", "Copper", "Gilded", "Rowdy", "Hidden"];
const PRICES: RawPlace["price"][] = ["cheap", "comfortable", "splashing"];

export const stubProvider: PlacesProvider = {
  async lookup(area, venueType): Promise<RawPlace[]> {
    if (!isCovered(area)) return [];               // coverage gap → empty
    const a = area.trim().toLowerCase();
    const kind = classify(venueType);
    const seed = hash(a + "|" + venueType.toLowerCase());
    const n = 1 + (seed % 3);                       // 1..3 deterministic candidates
    const out: RawPlace[] = [];
    for (let i = 0; i < n; i++) {
      const h = hash(`${a}|${venueType}|${i}`);
      out.push({
        id: `${a}-${kind}-${(h % 9000) + 1000}`,
        title: `The ${ADJ[h % ADJ.length]} ${nounFor(kind)}`,
        kind,
        price: PRICES[h % 3],
        tags: tagsFor(kind, h),
        open: true,
      });
    }
    return out;
  },
};

function classify(t: string): string {
  const s = t.toLowerCase();
  if (/(bar|pub|wine|cocktail|beer|tap)/.test(s)) return "bar";
  if (/(ramen|food|dinner|restaurant|eat|plates|pizza|taco|kitchen|bbq|grill)/.test(s)) return "food";
  if (/(club|dance|late|disco)/.test(s)) return "club";
  if (/(coffee|cafe|café|brunch|tea)/.test(s)) return "cafe";
  if (/(mini|golf|game|arcade|bowl|karaoke|darts|activity)/.test(s)) return "activity";
  return "spot";
}
function nounFor(kind: string): string {
  return ({ bar: "Bar", food: "Kitchen", club: "Club", cafe: "Café", activity: "Arcade", spot: "Spot" } as Record<string, string>)[kind] ?? "Spot";
}
function tagsFor(kind: string, h: number): string[] {
  const t: string[] = [];
  if (h % 4 !== 0) t.push("veg");                 // most venues have veg options; ~1 in 4 don't
  if (h % 3 === 0) t.push("late");
  if (kind === "bar" && h % 2 === 1) t.push("cocktails");
  if (h % 5 === 0) t.push("outdoor");
  return t;
}
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
