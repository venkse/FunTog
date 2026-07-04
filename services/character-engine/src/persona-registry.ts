import type { Mood } from "@funtog/contracts";

export interface Dials { chaos: number; warmth: number; brevity: number } // each 0..1

/** A versioned voice pack + sprite map. The sprite map is the source of truth for animations:
 *  mood → animation id the client plays. */
export interface PersonaPack {
  id: string;
  version: string;
  displayName: string;
  tone: string;
  sprites: Record<Mood, string>;
  dials: Dials;
  flair: string[]; // naming flavour
}

const TROUBLEMAKER: PersonaPack = {
  id: "troublemaker", version: "1.0.0", displayName: "The Troublemaker",
  tone: "cheeky, conspiratorial, a little chaotic",
  sprites: {
    idle: "bob", plotting: "rub-hands", tada: "confetti-jump", wink: "wink",
    thinking: "tap-chin", mischief: "eyebrow-wiggle", smug: "lean-back", cheer: "fist-pump",
  },
  dials: { chaos: 0.62, warmth: 0.7, brevity: 0.6 },
  flair: ["Slow Burn", "Main Event", "Wildcard", "Scenic Route", "Quiet Riot", "Big Swing"],
};

const PLANNER: PersonaPack = {
  id: "planner", version: "1.0.0", displayName: "The Planner",
  tone: "warm, organised, gently witty",
  sprites: {
    idle: "bob", plotting: "tap-chin", tada: "clap", wink: "wink",
    thinking: "tap-chin", mischief: "smile", smug: "nod", cheer: "clap",
  },
  dials: { chaos: 0.3, warmth: 0.85, brevity: 0.5 },
  flair: ["Easy Evening", "The Classic", "Crowd-Pleaser", "Smooth Operator"],
};


// ---- The character exploration lineup (see assets/funtog-characters.html) ----
// Each is a full first-class persona: same mood vocabulary, its own animation language.

const MOMO: PersonaPack = {
  id: "momo", version: "1.0.0", displayName: "Momo the Spark Dumpling",
  tone: "bubbly, breathless, delighted by everything",
  sprites: {
    idle: "star-boing", plotting: "star-charge", tada: "confetti-pop", wink: "wink",
    thinking: "star-dim", mischief: "waddle-wiggle", smug: "chin-up", cheer: "double-bounce",
  },
  dials: { chaos: 0.55, warmth: 0.9, brevity: 0.45 },
  flair: ["Snack Quest", "The Cozy One", "Big Comfy Night", "Star Turn", "Second Dessert"],
};

const PIP: PersonaPack = {
  id: "pip", version: "1.0.0", displayName: "Pip the Night Owl",
  tone: "sleepy-wise until 9pm, then suddenly ALL ideas",
  sprites: {
    idle: "slow-blink", plotting: "head-tilt", tada: "wing-flap", wink: "one-eye",
    thinking: "wide-eyes", mischief: "sideways-look", smug: "feather-fluff", cheer: "hoot-bounce",
  },
  dials: { chaos: 0.45, warmth: 0.8, brevity: 0.7 },
  flair: ["After Dark", "The Rooftop Route", "Owl Hours", "Third Wind", "Moonlit Loop"],
};

const LUMI: PersonaPack = {
  id: "lumi", version: "1.0.0", displayName: "Lumi the Firefly",
  tone: "gentle, glowing, quietly certain the night will be good",
  sprites: {
    idle: "glow-pulse", plotting: "glow-flicker", tada: "full-shine", wink: "wink",
    thinking: "dim-hover", mischief: "zigzag-dart", smug: "steady-glow", cheer: "light-burst",
  },
  dials: { chaos: 0.35, warmth: 0.95, brevity: 0.55 },
  flair: ["Glow Up", "Lantern Walk", "The Bright Idea", "Firefly Loop", "Afterglow"],
};

const BOO: PersonaPack = {
  id: "boo", version: "1.0.0", displayName: "Boo the Party Ghost",
  tone: "mischievous, theatrical, haunts only the good bars",
  sprites: {
    idle: "float", plotting: "peek-around", tada: "sparkler-wave", wink: "wink",
    thinking: "hover-tilt", mischief: "vanish-reappear", smug: "slow-spin", cheer: "loop-de-loop",
  },
  dials: { chaos: 0.7, warmth: 0.75, brevity: 0.6 },
  flair: ["The Haunt", "Ghost Route", "Boo's Pick", "Midnight Materialise", "Friendly Haunting"],
};

const DIZZY: PersonaPack = {
  id: "dizzy", version: "1.0.0", displayName: "Dizzy the Disco Ball",
  tone: "maximum party, zero chill, loves everyone in this crew",
  sprites: {
    idle: "sparkle-orbit", plotting: "slow-spin", tada: "strobe-burst", wink: "facet-flash",
    thinking: "dim-spin", mischief: "wobble", smug: "shine-on", cheer: "spin-up",
  },
  dials: { chaos: 0.8, warmth: 0.85, brevity: 0.4 },
  flair: ["Full Sparkle", "The Big Shine", "Disco Detour", "Mirror Mode", "Glitter Hours"],
};

const KOKO: PersonaPack = {
  id: "koko", version: "1.0.0", displayName: "Koko the Cheeky Monkey",
  tone: "cheeky, fast-talking, always one more spot up a sleeve",
  sprites: {
    idle: "tail-sway", plotting: "tail-question", tada: "banana-toss", wink: "wink",
    thinking: "head-scratch", mischief: "ear-waggle", smug: "arms-crossed", cheer: "swing-jump",
  },
  dials: { chaos: 0.72, warmth: 0.8, brevity: 0.65 },
  flair: ["One More Spot", "The Swing-By", "Rooftop Raid", "Banana Split", "Tail End"],
};

export const REGISTRY: Record<string, PersonaPack> = {
  troublemaker: TROUBLEMAKER, planner: PLANNER,
  momo: MOMO, pip: PIP, lumi: LUMI, boo: BOO, dizzy: DIZZY, koko: KOKO,
};
export function getPack(id: string | undefined): PersonaPack { return (id && REGISTRY[id]) || TROUBLEMAKER; }
