// PRODUCED by Suggestion. CONSUMED by Orchestrator -> Character.
export type GroundingMode = "shapes" | "grounded";

export interface CrewConstraints {
  veg?: boolean;
  budget?: "cheap" | "comfortable" | "splashing";
  dislikes?: string[];
  [k: string]: unknown;
}

export interface PlanRequest {
  crewId: string;
  vibe: string;
  area?: string;
  budget?: string;
  crewConstraints: CrewConstraints;
  personaHints?: Record<string, unknown>; // derived by Orchestrator from PersonaState
  groundingMode: GroundingMode;
}

export interface SlotSpec {
  venueType: string;          // e.g. "lively natural-wine bar"
  priceBand?: string;
  mustHave?: string[];        // e.g. ["veg"]
  walkableFromPrev?: boolean;
}

export interface VenueRef {
  venueId: string;
  name: string;
  [k: string]: unknown;       // hours, location, price — resolved by Venue/Knowledge
}

export interface PlanStop {
  time: string;               // "20:00"
  slot?: SlotSpec;            // shapes mode
  venue?: VenueRef;           // grounded mode
  satisfiedConstraints?: string[];
}

// NEUTRAL: no name/voice. Character adds those.
export interface PlanCandidate {
  id: string;
  arc: string;
  stops: PlanStop[];
}
